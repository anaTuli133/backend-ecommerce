const express = require('express')
const { userUpdateController } = require('../controllers/userControllers')

const router = express.Router()

/**
 * @swagger
 * /api/v1/user/update/{id}:
 *   post:
 *     tags: [User - Account]
 *     summary: Update my own account
 *     description: |
 *       Only for the role `user`. The id in the URL must be the id of the logged-in user (403 otherwise).
 *       `role`, `status`, `password` and `isVerifed` are ignored, they can not be changed here.
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

module.exports = router
