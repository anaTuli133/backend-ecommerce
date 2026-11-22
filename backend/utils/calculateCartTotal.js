// price of one unit after the product discount
// percent -> discountPrice is the percentage off, fixed -> discountPrice is the final price
const getUnitPrice = (product) => {
    if (!product.discountType || !product.discountPrice) {
        return product.price
    }
    if (product.discountType === 'percent') {
        return product.price - (product.price * product.discountPrice) / 100
    }
    return product.discountPrice
}

// cartItems must be populated, item.product is the product document
const calculateCartTotal = (cartItems) => {
    return cartItems.reduce((total, item) => total + getUnitPrice(item.product) * item.quantity, 0)
}

module.exports = { calculateCartTotal, getUnitPrice }
