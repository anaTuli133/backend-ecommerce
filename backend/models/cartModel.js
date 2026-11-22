const mongoose = require('mongoose')
const { Schema } = mongoose

const cartSchema = new Schema({
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    product: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    }
}, { timestamps: true })

// one product can appear only once in a user's cart
cartSchema.index({ owner: 1, product: 1 }, { unique: true })

module.exports = mongoose.model('Cart', cartSchema)
