const axios = require('axios')
const Cart = require('../models/cartModel')
const Coupon = require('../models/couponModel')
const Order = require('../models/orderModel')
const Product = require('../models/productModel')
const aamarpay = require('../config/aamarpayConfig')
const { calculateCartTotal, getUnitPrice } = require('../utils/calculateCartTotal')

// asks aamarPay for a payment page, returns the aamarPay response
const sendToAamarpay = async (tranId, amount, desc, customer) => {
    const paymentData = {
        store_id: aamarpay.storeId,
        tran_id: tranId,
        success_url: aamarpay.successUrl,
        fail_url: aamarpay.failUrl,
        cancel_url: aamarpay.cancelUrl,
        amount: amount,
        currency: aamarpay.currency,
        signature_key: aamarpay.signatureKey,
        desc: desc,
        cus_name: customer.cus_name,
        cus_email: customer.cus_email,
        cus_add1: customer.cus_add1,
        cus_add2: customer.cus_add2,
        cus_city: customer.cus_city,
        cus_state: customer.cus_state,
        cus_postcode: customer.cus_postcode,
        cus_country: aamarpay.country,
        cus_phone: customer.cus_phone,
        type: 'json'
    }
    return axios.post(aamarpay.paymentUrl, paymentData, {
        headers: { 'Content-Type': 'application/json' }
    })
}

const paymentController = async (req, res) => {
    try {
        const { desc, cus_name, cus_email, cus_add1, cus_add2, cus_city, cus_state, cus_postcode, cus_phone, coupon } = req.body
        // the owner always comes from the token, never from the request body
        const ownerId = req.user._id

        const cartItems = await Cart.find({ owner: ownerId }).populate('product')
        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' })
        }
        for (const item of cartItems) {
            if (!item.product || item.quantity > item.product.stock) {
                return res.status(400).json({ success: false, message: 'Insufficient product stock', product: item.product?.title })
            }
        }

        let total = calculateCartTotal(cartItems)

        let couponCode
        if (coupon) {
            couponCode = String(coupon).trim().toUpperCase()
            const existingCoupon = await Coupon.findOne({ code: couponCode })
            if (!existingCoupon) {
                return res.status(404).json({ success: false, message: 'Coupon not found' })
            }
            if (existingCoupon.redeemedBy.some((id) => String(id) === String(ownerId))) {
                return res.status(400).json({ success: false, message: 'Coupon already used' })
            }
            if (total < existingCoupon.minPurchase) {
                return res.status(400).json({ success: false, message: `Minimum purchase is ${existingCoupon.minPurchase}` })
            }
            const discount = existingCoupon.discountType === 'percent'
                ? (total * existingCoupon.discountValue) / 100
                : existingCoupon.discountValue
            total = Math.max(total - discount, 0)
        }

        const tranId = `${Date.now()}${Math.floor(Math.random() * 1000)}`

        const customer = { cus_name, cus_email, cus_add1, cus_add2, cus_city, cus_state, cus_postcode, cus_phone }
        const response = await sendToAamarpay(tranId, total, desc, customer)

        await Order.create({
            tranId,
            owner: ownerId,
            amount: total,
            coupon: couponCode,
            desc,
            customer,
            products: cartItems.map((item) => ({
                product: item.product._id,
                title: item.product.title,
                unitPrice: getUnitPrice(item.product),
                quantity: item.quantity
            }))
        })

        return res.status(200).json({ success: true, message: 'Payment initialized', tranId, data: response.data })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Payment initialization failed', error: error.response?.data || error.message })
    }
}

const paymentVerify = async (req, res) => {
    try {
        const { id } = req.params
        const ownerId = req.user._id

        const order = await Order.findOne({ tranId: id, owner: ownerId })
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' })
        }
        if (order.status === 'PAID') {
            return res.status(200).json({ success: true, message: 'Order already paid', data: order })
        }

        const response = await axios.get(
            `${aamarpay.verifyUrl}?request_id=${id}&store_id=${aamarpay.storeId}&signature_key=${aamarpay.signatureKey}&type=json`,
            { headers: { 'Content-Type': 'application/json' } }
        )

        if (response.data.pay_status === 'Successful') {
            order.status = 'PAID'
            await order.save()
            await Cart.deleteMany({ owner: ownerId })
            if (order.coupon) {
                await Coupon.updateOne({ code: order.coupon }, { $addToSet: { redeemedBy: ownerId } })
            }
        } else if (response.data.pay_status === 'Failed') {
            order.status = 'FAILED'
            await order.save()
        }

        return res.status(200).json({ success: true, message: `Order status: ${order.status}`, data: order })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Payment verification failed', error: error.response?.data || error.message })
    }
}

// pay again for an order whose payment failed or was cancelled
const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body
        const ownerId = req.user._id

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order id is required' })
        }

        // a user can retry only his own order
        const order = await Order.findOne({ _id: orderId, owner: ownerId })
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' })
        }
        if (order.status === 'PAID') {
            return res.status(400).json({ success: false, message: 'Order is already paid' })
        }
        if (order.status === 'PENDING') {
            return res.status(400).json({ success: false, message: 'Payment is still pending, verify it first' })
        }

        // stock may have changed since the first try
        for (const item of order.products) {
            const product = await Product.findById(item.product)
            if (!product || item.quantity > product.stock) {
                return res.status(400).json({ success: false, message: 'Insufficient product stock', product: item.title })
            }
        }

        // customer details saved on the order, anything sent in the body replaces them
        const customer = { ...(order.customer ? order.customer.toObject() : {}) }
        for (const key of ['cus_name', 'cus_email', 'cus_add1', 'cus_add2', 'cus_city', 'cus_state', 'cus_postcode', 'cus_phone']) {
            if (req.body[key]) customer[key] = req.body[key]
        }
        if (!customer.cus_name || !customer.cus_email || !customer.cus_phone) {
            return res.status(400).json({ success: false, message: 'cus_name, cus_email and cus_phone are required' })
        }

        // aamarPay needs a fresh transaction id for every try
        const tranId = `${Date.now()}${Math.floor(Math.random() * 1000)}`
        const response = await sendToAamarpay(tranId, order.amount, order.desc, customer)

        order.tranId = tranId
        order.customer = customer
        order.status = 'PENDING'
        await order.save()

        return res.status(200).json({ success: true, message: 'Payment initialized again', tranId, data: response.data })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Payment initialization failed', error: error.response?.data || error.message })
    }
}

// put the products of an old order back into my cart
const reOrder = async (req, res) => {
    try {
        const { orderId } = req.body
        const ownerId = req.user._id

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order id is required' })
        }

        // a user can reorder only his own order
        const order = await Order.findOne({ _id: orderId, owner: ownerId })
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' })
        }

        const added = []
        const skipped = []

        for (const item of order.products) {
            const product = await Product.findById(item.product)
            if (!product) {
                skipped.push({ title: item.title, reason: 'Product not found' })
                continue
            }

            const cartItem = await Cart.findOne({ owner: ownerId, product: item.product })
            const wantedQuantity = (cartItem ? cartItem.quantity : 0) + item.quantity
            if (wantedQuantity > product.stock) {
                skipped.push({ title: item.title, reason: 'Insufficient product stock', availableStock: product.stock })
                continue
            }

            if (cartItem) {
                cartItem.quantity = wantedQuantity
                await cartItem.save()
            } else {
                await Cart.create({ owner: ownerId, product: item.product, quantity: item.quantity })
            }
            added.push(item.title)
        }

        return res.status(200).json({ success: true, message: `${added.length} product added to cart, ${skipped.length} skipped`, added, skipped })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
}

module.exports = { paymentController, paymentVerify, retryPayment, reOrder }
