const mongoose = require('mongoose')
const { Schema } = mongoose

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percent', 'fixed'],
        required: true
    },
    // percent -> percentage off, fixed -> amount off
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minPurchase: {
        type: Number,
        default: 0
    },
    redeemedBy: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

module.exports = mongoose.model('Coupon', couponSchema)
