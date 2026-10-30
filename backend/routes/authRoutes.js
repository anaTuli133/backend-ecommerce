const express = require('express')
const { registerController, loginController, verifyAccountController, forgotPasswordController, resetPasswordController } = require('../controllers/authControllers')
const router = express.Router()

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new account
 *     description: Saves the user and sends a verification link to the given email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, confirmPassword, terms]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Anamika Saha
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Minimum 8 characters, at least one letter and one number
 *                 example: abc12345
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: abc12345
 *               terms:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Account created
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error (duplicate email also lands here)
 */
router.post('/register', registerController)

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in and receive a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: abc12345
 *     responses:
 *       200:
 *         description: Signed in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login success.
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: user
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Missing field or wrong credentials
 *       500:
 *         description: Server error
 */
router.post('/login', loginController)

/**
 * @swagger
 * /api/v1/auth/verify/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Confirm an email address
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token that was mailed to the user
 *     responses:
 *       200:
 *         description: Account is now verified
 *       400:
 *         description: Token invalid, expired or account already verified
 *       404:
 *         description: User not found
 */
router.get('/verify/:token', verifyAccountController)

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Mail a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *     responses:
 *       200:
 *         description: Reset mail sent
 *       400:
 *         description: Email missing
 *       404:
 *         description: No user with this email
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', forgotPasswordController)

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Set a new password using the mailed token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset token from the email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newpass123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: newpass123
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Fields missing, passwords differ, or token invalid / expired
 *       404:
 *         description: Token or user not found
 */
router.post('/reset-password/:token', resetPasswordController)

module.exports = router
