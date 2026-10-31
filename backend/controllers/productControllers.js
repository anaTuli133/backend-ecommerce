const fs = require("fs")
const path = require("path")
const { nanoid } = require("nanoid");
const slugify = require("slugify")
const Product = require('../models/productModel')
const { readSheet } = require('read-excel-file/node')
const writeExcelFile = require('write-excel-file/node')
const { schema, columns } = require('../utils/productsUtility')



const createProductController = async (req, res) => {
    try {
        const {
            title,
            description = '',
            shortDescription = '',
            price,
            discountPrice = 0,
            category,
            subCategory,
            mainImageIndex = 0,
            owner,
            stock
        } = req.body

        
        const slug = slugify(title, { lower: true, strict: true, trim: true })
        const isExistbySlug = await Product.findOne({ slug })
        if (isExistbySlug) {
            return res.status(400).json({ success: false, message: 'Product already exist with this slug' })
        }
        const sku = `LM-${nanoid(10)}`
        const isExistbySku = await Product.findOne({ sku })
        if (isExistbySku) {
            return res.status(400).json({ success: false, message: 'Product already exist with this sku' })
        }
        const images = (req.files || []).map((file, index) => {
            return {
                url: `uploads/${file.filename}`,
                isMain: mainImageIndex == index
            }
        })
        const product = new Product({ title, stock, description, shortDescription, price, discountPrice, category, subCategory, owner, images, slug, sku })
        await product.save()
        return res.status(201).json({ success: true, message: 'Product created successfully', data: product })
    } catch (error) {
        console.error('createProduct error:', error)
        return res.status(500).json({ status: false, message: error.message })
    }
}

const getAllProductsController = async (req, res) => {
    try {
        const products = await Product.find().populate(['owner', 'category', 'subCategory'])
        return res.status(200).json({ success: true, message: 'Products get successfully', data: products })
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Internal server error' })
    }
}

const getSingleProductsController = async (req, res) => {
    try {
        const { id } = req.params
        const product = await Product.findById(id).populate(['owner', 'category', 'subCategory'])
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' })
        }
        return res.status(200).json({ success: true, message: 'Product get successfully', data: product })
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Internal server error' })
    }
}

const getProductsByOwnerController = async (req, res) => {
    try {
        const { ownerId } = req.params
        const products = await Product.find({ owner: ownerId }).populate(['owner', 'category', 'subCategory'])
        return res.status(200).json({ success: true, message: 'Products get successfully by owner', data: products })
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Internal server error' })
    }
}

const getProductsByCategoryController = async (req, res) => {
    try {
        const { categoryId } = req.params
        const products = await Product.find({ category: categoryId }).populate(['owner', 'category', 'subCategory'])
        return res.status(200).json({ success: true, message: 'Products get successfully by category', data: products })
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Internal server error' })
    }
}

const getProductsBySubCategoryController = async (req, res) => {
    try {
        const { subcategoryId } = req.params
        const products = await Product.find({ subCategory: subcategoryId }).populate(['owner', 'category', 'subCategory'])
        return res.status(200).json({ success: true, message: 'Products get successfully by subcategory', data: products })
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Internal server error' })
    }
}

const deleteProductsController = async (req, res) => {
    try {
        const { id } = req.params
        const deletedProduct = await Product.findByIdAndDelete(id)
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found or already deleted' })
        }
        return res.status(200).json({ success: true, message: 'Product deleted successfully', data: deletedProduct })
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Internal server error' })
    }
}


// ---------- helpers for product update ----------

// deleteIndex can reach us as [0,2] / ['0','2'] / '0' / '0,2' / '[0,2]' depending on how the client sends form-data
const parseIndexList = (raw) => {
    if (raw === undefined || raw === null || raw === '') return []
    let list = raw
    if (typeof raw === 'string') {
        try {
            list = JSON.parse(raw)
        } catch (e) {
            list = raw.split(',')
        }
    }
    if (!Array.isArray(list)) list = [list]
    return [...new Set(list.map((item) => Number(item)).filter((n) => Number.isInteger(n) && n >= 0))]
}

// remove physical files, a missing file should never break the request
const removeImageFiles = async (images) => {
    await Promise.all(images.map(async (image) => {
        try {
            const filePath = path.join(__dirname, '..', 'uploads', path.basename(image.url || ''))
            await fs.promises.unlink(filePath)
        } catch (err) {
            if (err.code !== 'ENOENT') console.error('image remove failed:', err.message)
        }
    }))
}

const updateProductController = async (req, res) => {
    const uploadedFiles = req.files || []
    try {
        const { id } = req.params
        const body = req.body || {}

        if (body.sku || body.slug) {
            await removeImageFiles(uploadedFiles.map((f) => ({ url: f.filename })))
            return res.status(400).json({ success: false, message: 'sku and slug can not be changed' })
        }

        const product = await Product.findById(id)
        if (!product) {
            await removeImageFiles(uploadedFiles.map((f) => ({ url: f.filename })))
            return res.status(404).json({ success: false, message: 'Product not found' })
        }

        // vendors can touch only their own products, admin can touch all
        if (req.user.role !== 'admin' && String(product.owner) !== String(req.user._id)) {
            await removeImageFiles(uploadedFiles.map((f) => ({ url: f.filename })))
            return res.status(403).json({ success: false, message: 'You can not update this product' })
        }

        // 1) plain fields (whitelist only)
        const editable = ['title', 'shortDescription', 'description', 'price', 'discountPrice', 'stock', 'category', 'subCategory']
        editable.forEach((key) => {
            if (body[key] !== undefined) product[key] = body[key]
        })

        // 2) delete many images at once, indexes refer to the images array of the current product
        const deleteList = parseIndexList(body.deleteIndex)
        const outOfRange = deleteList.filter((i) => i >= product.images.length)
        if (outOfRange.length) {
            await removeImageFiles(uploadedFiles.map((f) => ({ url: f.filename })))
            return res.status(400).json({ success: false, message: `Invalid image index: ${outOfRange.join(', ')}` })
        }
        const removedImages = product.images.filter((_, i) => deleteList.includes(i))
        const keptImages = product.images.filter((_, i) => !deleteList.includes(i))

        // 3) add newly uploaded images
        const newImages = uploadedFiles.map((file) => ({ url: `uploads/${file.filename}`, isMain: false }))
        const finalImages = [...keptImages, ...newImages]

        // 4) decide the main image, index is counted on the final list (kept + new)
        if (finalImages.length) {
            let mainIndex = finalImages.findIndex((img) => img.isMain)
            if (body.mainImageIndex !== undefined && body.mainImageIndex !== '') {
                const requested = Number(body.mainImageIndex)
                if (!Number.isInteger(requested) || requested < 0 || requested >= finalImages.length) {
                    await removeImageFiles(uploadedFiles.map((f) => ({ url: f.filename })))
                    return res.status(400).json({ success: false, message: 'mainImageIndex is out of range' })
                }
                mainIndex = requested
            }
            if (mainIndex === -1) mainIndex = 0
            finalImages.forEach((img, i) => { img.isMain = i === mainIndex })
        }
        product.images = finalImages

        await product.save()
        await removeImageFiles(removedImages)

        return res.status(200).json({
            success: true,
            message: `Product updated${removedImages.length ? `, ${removedImages.length} image(s) removed` : ''}`,
            data: product
        })
    } catch (error) {
        await removeImageFiles(uploadedFiles.map((f) => ({ url: f.filename })))
        console.error('updateProduct error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// Category and subcategory given to every product that comes from an Excel file
// (the sheet has no category column). Change these two ids to the ones you want.
const EXCEL_DEFAULT_CATEGORY = '6adb13e156885c49f9cf965e'
const EXCEL_DEFAULT_SUBCATEGORY = '6adb146f56885c49f9cf965f'

const bulkuploadProductsExcelController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please select an Excel file' })
        }
        const { objects, errors } = await readSheet(req.file.path, { schema })
        // rows without a title are ignored
        const rows = objects.filter((item) => item.title)
        const productList = rows.map((item) => ({
            ...item,
            images: item.images
                ? item.images.split(',').map((url, index) => ({ url: url.trim(), isMain: index === 0 }))
                : [],
            category: EXCEL_DEFAULT_CATEGORY,
            subCategory: EXCEL_DEFAULT_SUBCATEGORY,
            owner: req.user._id,
            sku: item.sku || `LM-${nanoid(10)}`,
            slug: item.slug || slugify(item.title, { lower: true, strict: true, trim: true })
        }))
        const savedProducts = await Product.insertMany(productList)
        return res.status(201).json({ success: true, message: 'Products uploaded successfully', data: { errors, products: savedProducts } })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message })
    }
}

const bulkdownloadProductsExcelController = async (req, res) => {
    try {
        const productData = await Product.find().lean()
        const filesDir = path.join(__dirname, '..', 'files')
        fs.mkdirSync(filesDir, { recursive: true })
        const fileName = `products-${Date.now()}.xlsx`
        await writeExcelFile(productData, { columns }).toFile(path.join(filesDir, fileName))
        return res.status(200).json({ success: true, message: 'Products downloaded successfully', data: { file: `files/${fileName}` } })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message })
    }
}

module.exports = {createProductController,getAllProductsController,getSingleProductsController,getProductsByOwnerController,deleteProductsController,getProductsByCategoryController,getProductsBySubCategoryController,updateProductController,bulkuploadProductsExcelController,bulkdownloadProductsExcelController}