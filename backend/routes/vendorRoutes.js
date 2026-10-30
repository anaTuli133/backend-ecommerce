const express = require('express')
const {
    createCategory,
    createSubCategory,
    getAllSubCategory,
    getAllSubCategoriesByCategory,
    getAllCategoriesByOwner,
    getAllCategories,
} = require('../controllers/vendorController')
const upload = require('../middlewares/uploadMiddleware')
const { createProductController, getAllProductsController,
    getSingleProductsController,
    getProductsByOwnerController,
    deleteProductsController,
    getProductsBySubCategoryController,
    getProductsByCategoryController,
    updateProductController
} = require('../controllers/productControllers')

const router = express.Router()

// category

/**
 * @swagger
 * /api/v1/vendor/create/category:
 *   post:
 *     tags: [Vendor - Category]
 *     summary: Add a category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Laptop
 *     responses:
 *       201:
 *         description: Category created (name is stored in lowercase)
 *       400:
 *         description: Name missing or category already exists
 *       401:
 *         description: Role not allowed
 */
router.post('/create/category', createCategory)

/**
 * @swagger
 * /api/v1/vendor/create/subcategory:
 *   post:
 *     tags: [Vendor - Category]
 *     summary: Add a subcategory under a category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, parentCategory]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gaming Laptop
 *               parentCategory:
 *                 type: string
 *                 description: Id of the parent category
 *                 example: 66f1a2b3c4d5e6f7a8b9c0a1
 *     responses:
 *       201:
 *         description: Subcategory created
 *       400:
 *         description: Required field missing or subcategory already exists
 */
router.post('/create/subcategory', createSubCategory)

/**
 * @swagger
 * /api/v1/vendor/all/category:
 *   get:
 *     tags: [Vendor - Category]
 *     summary: List every category (owner is populated)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/all/category', getAllCategories)

/**
 * @swagger
 * /api/v1/vendor/all/subcategory:
 *   get:
 *     tags: [Vendor - Category]
 *     summary: List every subcategory (parent category is populated)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subcategory list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubCategory'
 */
router.get('/all/subcategory', getAllSubCategory)

/**
 * @swagger
 * /api/v1/vendor/category/{id}/subcategory:
 *   get:
 *     tags: [Vendor - Category]
 *     summary: Subcategories that belong to one category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category id
 *     responses:
 *       200:
 *         description: Subcategory list
 *       400:
 *         description: Invalid object id
 */
router.get('/category/:id/subcategory', getAllSubCategoriesByCategory)

/**
 * @swagger
 * /api/v1/vendor/user/{id}/category:
 *   get:
 *     tags: [Vendor - Category]
 *     summary: Categories (with their subcategories) created by a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Owner user id
 *     responses:
 *       200:
 *         description: Categories grouped for this owner
 *       400:
 *         description: Invalid object id
 */
router.get('/user/:id/category', getAllCategoriesByOwner)

// products

/**
 * @swagger
 * /api/v1/vendor/products/create:
 *   post:
 *     tags: [Vendor - Product]
 *     summary: Create a product with one or more images
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, price, category, subCategory, owner]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Dell Inspiron 15
 *               shortDescription:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 example: 75000
 *               discountPrice:
 *                 type: number
 *                 example: 70000
 *               stock:
 *                 type: number
 *                 example: 12
 *               category:
 *                 type: string
 *                 description: Category id
 *               subCategory:
 *                 type: string
 *                 description: Subcategory id
 *               owner:
 *                 type: string
 *                 description: User id of the product owner
 *               mainImageIndex:
 *                 type: integer
 *                 default: 0
 *                 description: Position (in the uploaded files) of the cover image
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files, 5 MB max each
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Slug or SKU already used
 *       500:
 *         description: Server error
 */
router.post('/products/create', upload.array('images'), createProductController)

/**
 * @swagger
 * /api/v1/vendor/products/all:
 *   get:
 *     tags: [Vendor - Product]
 *     summary: List all products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products with owner, category and subCategory populated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/products/all', getAllProductsController)

/**
 * @swagger
 * /api/v1/vendor/products/{id}:
 *   get:
 *     tags: [Vendor - Product]
 *     summary: Get one product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product id
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *   delete:
 *     tags: [Vendor - Product]
 *     summary: Delete a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product id
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found or already deleted
 */
router.get('/products/:id', getSingleProductsController)

/**
 * @swagger
 * /api/v1/vendor/products/owner/{ownerId}:
 *   get:
 *     tags: [Vendor - Product]
 *     summary: Products of one owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Owner user id
 *     responses:
 *       200:
 *         description: Product list
 */
router.get('/products/owner/:ownerId', getProductsByOwnerController)

/**
 * @swagger
 * /api/v1/vendor/products/category/{categoryId}:
 *   get:
 *     tags: [Vendor - Product]
 *     summary: Products inside a category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category id
 *     responses:
 *       200:
 *         description: Product list
 */
router.get('/products/category/:categoryId', getProductsByCategoryController)

/**
 * @swagger
 * /api/v1/vendor/products/subcategory/{subcategoryId}:
 *   get:
 *     tags: [Vendor - Product]
 *     summary: Products inside a subcategory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subcategoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory id
 *     responses:
 *       200:
 *         description: Product list
 */
router.get('/products/subcategory/:subcategoryId', getProductsBySubCategoryController)

router.delete('/products/:id', deleteProductsController)

/**
 * @swagger
 * /api/v1/vendor/products/update/{id}:
 *   post:
 *     tags: [Vendor - Product]
 *     summary: Edit a product, add images and remove several images at once
 *     description: |
 *       Every field is optional, send only what should change.
 *
 *       Order of work: `deleteIndex` removes images from the current list, then new `images` are appended,
 *       then `mainImageIndex` (counted on the final list) picks the cover image.
 *       If the cover image was deleted and no index is sent, the first remaining image becomes the cover.
 *       Removed images are also erased from the uploads folder.
 *       `sku` and `slug` can not be changed. A vendor can edit only their own products, admin can edit all.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product id
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discountPrice:
 *                 type: number
 *               stock:
 *                 type: number
 *               category:
 *                 type: string
 *               subCategory:
 *                 type: string
 *               deleteIndex:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Zero based positions of the existing images to remove, e.g. 0 and 2
 *               mainImageIndex:
 *                 type: integer
 *                 description: Cover image position in the final list (kept + newly uploaded)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New image files to append
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Product updated, 2 image(s) removed
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: sku/slug sent, or deleteIndex / mainImageIndex out of range
 *       403:
 *         description: Product belongs to another vendor
 *       404:
 *         description: Product not found
 */
router.post('/products/update/:id', upload.array('images'), updateProductController)

module.exports = router
