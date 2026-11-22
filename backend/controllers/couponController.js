const Coupon = require('../models/couponModel')

const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minPurchase = 0 } = req.body

        if (!code || !discountType || discountValue === undefined) {
            return res.status(400).json({ success: false, message: 'code, discountType and discountValue are required' })
        }
        if (!['percent', 'fixed'].includes(discountType)) {
            return res.status(400).json({ success: false, message: 'discountType must be percent or fixed' })
        }
        if (typeof discountValue !== 'number' || discountValue <= 0 || (discountType === 'percent' && discountValue > 100)) {
            return res.status(400).json({ success: false, message: 'Invalid discountValue' })
        }
        if (typeof minPurchase !== 'number' || minPurchase < 0) {
            return res.status(400).json({ success: false, message: 'Invalid minPurchase' })
        }

        const couponCode = String(code).trim().toUpperCase()
        const existingCoupon = await Coupon.findOne({ code: couponCode })
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon already exists' })
        }

        // the owner always comes from the token
        const coupon = await Coupon.create({ code: couponCode, discountType, discountValue, minPurchase, owner: req.user._id })
        return res.status(201).json({ success: true, message: 'Coupon created', data: coupon })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' })
    }
}

module.exports = { createCoupon }
