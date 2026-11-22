const express = require('express')
const { userUpdateController } = require('../controllers/userControllers')
const { addToCart, changeCartQuantity, getCart } = require('../controllers/cartController')
const { paymentController, paymentVerify } = require('../controllers/paymentController')
const { getAllProductsController, getSingleProductBySlugController } = require('../controllers/productControllers')
const { getAllCategories, getAllSubCategory, getAllSubCategoriesByCategory, getAllCategoriesByOwner } = require('../controllers/vendorController')

const router = express.Router()

/**
 * @swagger
 * /api/v1/user/update/{id}:
 *   post:
 *     tags: [User - Account]
 *     summary: Update my own account
 *     description: |
 *       Only for the role `user`. The id in the URL must be the id of the logged-in user (403 otherwise).
 *       `role`, `status`, `password` and `isVerified` are ignored, they can not be changed here.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: My user id (data._id from the login response)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Anamika Saha
 *     responses:
 *       200:
 *         description: Account updated
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
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Token problem or user not found
 *       401:
 *         description: Only the role user is allowed
 *       403:
 *         description: This is not your account
 */
router.post('/update/:id', userUpdateController)


/**
 * @swagger
 * /api/v1/user/cart/add:
 *   post:
 *     tags: [User - Cart]
 *     summary: Add a product to my cart
 *     description: If the product is already in the cart, its quantity is increased. Quantity can never go above the product stock.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       201:
 *         description: Added to cart
 *       200:
 *         description: Quantity updated
 *       400:
 *         description: Invalid quantity or not enough stock
 *       404:
 *         description: Product not found
 */
router.post('/cart/add', addToCart)

/**
 * @swagger
 * /api/v1/user/cart/update/quantity/{cartId}:
 *   post:
 *     tags: [User - Cart]
 *     summary: Increase or decrease a cart item quantity
 *     description: Sending `dec` when the quantity is 1 removes the item from the cart.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [inc, dec]
 *     responses:
 *       200:
 *         description: Quantity updated or item removed
 *       400:
 *         description: Invalid type or not enough stock
 *       403:
 *         description: This cart item is not yours
 *       404:
 *         description: Cart item not found
 */
router.post('/cart/update/quantity/:cartId', changeCartQuantity)

/**
 * @swagger
 * /api/v1/user/cart:
 *   get:
 *     tags: [User - Cart]
 *     summary: Get my cart
 *     description: Returns my cart items with the product populated and the total after product discounts.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items and total
 */
router.get('/cart', getCart)

/**
 * @swagger
 * /api/v1/user/payment:
 *   post:
 *     tags: [User - Payment]
 *     summary: Start an aamarPay payment for my cart
 *     description: Total is calculated from my cart (product discounts, then the optional coupon). An order with status PENDING is created. Open `data.payment_url` to pay.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               desc:
 *                 type: string
 *                 example: Laptop order
 *               cus_name:
 *                 type: string
 *                 example: Anamika Saha
 *               cus_email:
 *                 type: string
 *                 example: test@example.com
 *               cus_add1:
 *                 type: string
 *               cus_add2:
 *                 type: string
 *               cus_city:
 *                 type: string
 *                 example: Dhaka
 *               cus_state:
 *                 type: string
 *                 example: Dhaka
 *               cus_postcode:
 *                 type: string
 *                 example: "1207"
 *               cus_phone:
 *                 type: string
 *                 example: "01700000000"
 *               coupon:
 *                 type: string
 *                 example: SAVE10
 *     responses:
 *       200:
 *         description: Payment initialized
 *       400:
 *         description: Cart empty, not enough stock, coupon used or minimum purchase not met
 *       404:
 *         description: Coupon not found
 */
router.post('/payment', paymentController)

/**
 * @swagger
 * /api/v1/user/payment/verify/{id}:
 *   get:
 *     tags: [User - Payment]
 *     summary: Verify a payment with aamarPay
 *     description: On success the order becomes PAID, my cart is cleared and the coupon is marked as used.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: tranId returned by POST /user/payment
 *     responses:
 *       200:
 *         description: Order with its current status
 *       404:
 *         description: Order not found
 */
router.get('/payment/verify/:id', paymentVerify)

// browse (products and categories)
router.get('/all/product', getAllProductsController)
router.get('/single/product/:slug', getSingleProductBySlugController)
router.get('/all/category', getAllCategories)
router.get('/all/subcategory', getAllSubCategory)
router.get('/all/category/:id/subcategory', getAllSubCategoriesByCategory)
router.get('/all/user/:id/category', getAllCategoriesByOwner)

module.exports = router
