const mongoose = require('mongoose')
const { Schema } = mongoose

const orderSchema = new Schema({
    tranId: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    // snapshot of the cart at the time of payment
    products: [
        {
            product: { type: Schema.Types.ObjectId, ref: 'Product' },
            title: String,
            unitPrice: Number,
            quantity: Number
        }
    ],
    coupon: {
        type: String
    },
    desc: {
        type: String
    },
    // customer details sent to aamarPay, kept so a failed payment can be retried
    customer: {
        cus_name: String,
        cus_email: String,
        cus_add1: String,
        cus_add2: String,
        cus_city: String,
        cus_state: String,
        cus_postcode: String,
        cus_phone: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    }
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)
