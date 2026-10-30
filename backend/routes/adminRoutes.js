const express = require('express')
const {
    userUpdateController,
    getAllUsersController,
    getUserController,
    getAllActiveUsersController,
    getAllDeactiveUsersController,
    deleteUserController,
    updateCategory,
    categoryDeleteController,
    getAllCategories
} = require('../controllers/adminControllers')
const { getAllCategoriesByOwner } = require('../controllers/vendorController')

const router = express.Router()

/**
 * @swagger
 * /api/v1/admin/all-users:
 *   get:
 *     tags: [Admin - User]
 *     summary: List every user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users (password is never returned)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Total 10 user found
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Admin token required
 */
router.get('/all-users', getAllUsersController)

/**
 * @swagger
 * /api/v1/admin/user/{id}:
 *   get:
 *     tags: [Admin - User]
 *     summary: Get a single user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     responses:
 *       200:
 *         description: User found
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
 *         description: User not found
 */
router.get('/user/:id', getUserController)

/**
 * @swagger
 * /api/v1/admin/active-users:
 *   get:
 *     tags: [Admin - User]
 *     summary: Users whose status is active
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active user list
 */
router.get('/active-users', getAllActiveUsersController)

/**
 * @swagger
 * /api/v1/admin/update/{id}:
 *   post:
 *     tags: [Admin - User]
 *     summary: Update a user (role, status, name ...)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
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
 *               role:
 *                 type: string
 *                 example: admin
 *               status:
 *                 type: string
 *                 enum: [active, suspended]
 *                 example: suspended
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: User not found
 */
router.post('/update/:id', userUpdateController)

/**
 * @swagger
 * /api/v1/admin/deactive-users:
 *   get:
 *     tags: [Admin - User]
 *     summary: Users whose status is suspended
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suspended user list
 */
router.get('/deactive-users', getAllDeactiveUsersController)

/**
 * @swagger
 * /api/v1/admin/delete/{id}:
 *   delete:
 *     tags: [Admin - User]
 *     summary: Remove a user permanently
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: User not found
 */
router.delete('/delete/:id', deleteUserController)

/**
 * @swagger
 * /api/v1/admin/categories:
 *   get:
 *     tags: [Admin - Category]
 *     summary: List all categories with their owners
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category list
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/categories', getAllCategories)

/**
 * @swagger
 * /api/v1/admin/update-category/{id}:
 *   post:
 *     tags: [Admin - Category]
 *     summary: Rename a category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mobile
 *     responses:
 *       200:
 *         description: Category renamed
 *       404:
 *         description: Category not found
 */
router.post('/update-category/:id', updateCategory)

/**
 * @swagger
 * /api/v1/admin/delete-category/{id}:
 *   post:
 *     tags: [Admin - Category]
 *     summary: Delete a category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category id
 *     responses:
 *       200:
 *         description: Category deleted
 *       404:
 *         description: Category not found
 */
router.post('/delete-category/:id', categoryDeleteController)

/**
 * @swagger
 * /api/v1/admin/user/{id}/category:
 *   get:
 *     tags: [Admin - Category]
 *     summary: Categories (with subcategories) created by a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Owner user id
 *     responses:
 *       200:
 *         description: Categories grouped for this owner
 *       400:
 *         description: Invalid object id
 */
router.get('/user/:id/category', getAllCategoriesByOwner)

module.exports = router
