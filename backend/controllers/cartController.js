const Cart = require('../models/cartModel')
const Product = require('../models/productModel')
const { calculateCartTotal } = require('../utils/calculateCartTotal')

const addToCart = async (req, res) => {
    try {
        const { productId } = req.body
        const quantity = Number(req.body.quantity ?? 1)
        // the owner always comes from the token, never from the request body
        const ownerId = req.user._id

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product id is required' })
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({ success: false, message: 'Quantity must be a whole number greater than 0' })
        }

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' })
        }

        const cartItem = await Cart.findOne({ owner: ownerId, product: productId })
        const wantedQuantity = (cartItem ? cartItem.quantity : 0) + quantity
        if (wantedQuantity > product.stock) {
            return res.status(400).json({ success: false, message: 'Insufficient product stock', availableStock: product.stock })
        }

        if (cartItem) {
            cartItem.quantity = wantedQuantity
            await cartItem.save()
            return res.status(200).json({ success: true, message: 'Cart quantity updated', data: cartItem })
        }

        const newItem = await Cart.create({ quantity, owner: ownerId, product: productId })
        return res.status(201).json({ success: true, message: 'Product added to cart', data: newItem })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
}

const changeCartQuantity = async (req, res) => {
    try {
        const { cartId } = req.params
        const { type } = req.body

        if (!['inc', 'dec'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid type, use inc or dec' })
        }

        const cartItem = await Cart.findById(cartId).populate('product')
        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Cart item not found' })
        }
        // a user can change only his own cart
        if (String(cartItem.owner) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'This cart item is not yours' })
        }

        if (type === 'dec') {
            if (cartItem.quantity <= 1) {
                await cartItem.deleteOne()
                return res.status(200).json({ success: true, message: 'Item removed from cart' })
            }
            cartItem.quantity -= 1
        } else {
            if (cartItem.quantity + 1 > cartItem.product.stock) {
                return res.status(400).json({ success: false, message: 'Insufficient product stock', availableStock: cartItem.product.stock })
            }
            cartItem.quantity += 1
        }

        await cartItem.save()
        return res.status(200).json({ success: true, message: 'Cart quantity updated', data: cartItem })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
}

const getCart = async (req, res) => {
    try {
        const cartItems = await Cart.find({ owner: req.user._id }).populate('product')
        const total = calculateCartTotal(cartItems.filter((item) => item.product))
        return res.status(200).json({ success: true, message: `Total ${cartItems.length} cart items found`, total, data: cartItems })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
}

module.exports = { addToCart, changeCartQuantity, getCart }
