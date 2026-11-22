const axios = require('axios')
const Cart = require('../models/cartModel')
const Coupon = require('../models/couponModel')
const Order = require('../models/orderModel')
const aamarpay = require('../config/aamarpayConfig')
const { calculateCartTotal, getUnitPrice } = require('../utils/calculateCartTotal')

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

        const paymentData = {
            store_id: aamarpay.storeId,
            tran_id: tranId,
            success_url: aamarpay.successUrl,
            fail_url: aamarpay.failUrl,
            cancel_url: aamarpay.cancelUrl,
            amount: total,
            currency: aamarpay.currency,
            signature_key: aamarpay.signatureKey,
            desc: desc,
            cus_name: cus_name,
            cus_email: cus_email,
            cus_add1: cus_add1,
            cus_add2: cus_add2,
            cus_city: cus_city,
            cus_state: cus_state,
            cus_postcode: cus_postcode,
            cus_country: aamarpay.country,
            cus_phone: cus_phone,
            type: 'json'
        }

        const response = await axios.post(aamarpay.paymentUrl, paymentData, {
            headers: { 'Content-Type': 'application/json' }
        })

        await Order.create({
            tranId,
            owner: ownerId,
            amount: total,
            coupon: couponCode,
            desc,
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

module.exports = { paymentController, paymentVerify }
