const path = require('path')
const swaggerJSDoc = require('swagger-jsdoc')

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-Commerce Backend API',
            version: '1.0.0',
            description: 'REST API documentation for auth, vendor (category / product) and admin modules.'
        },
        // http://localhost:8000/api-docs
        servers: [
            {
                url: process.env.SWAGGER_SERVER_URL || `http://localhost:${process.env.PORT || 8000}`,
                description: 'API server'
            }
        ],
        tags: [
            { name: 'Auth', description: 'Registration, login and password recovery' },
            { name: 'Vendor - Category', description: 'Category and subcategory management' },
            { name: 'Vendor - Product', description: 'Product management (vendor or admin token)' },
            { name: 'Admin - User', description: 'User management (admin token)' },
            { name: 'Admin - Category', description: 'Category moderation (admin token)' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Paste the accessToken returned by /auth/login'
                }
            },
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Something went wrong' }
                    }
                },
                ProductImage: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0d1' },
                        url: { type: 'string', example: 'uploads/1792742880812-laptop.jpg' },
                        isMain: { type: 'boolean', example: true }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0d2' },
                        title: { type: 'string', example: 'Dell Inspiron 15' },
                        slug: { type: 'string', example: 'dell-inspiron-15' },
                        sku: { type: 'string', example: 'LM-V1StGXR8_Z' },
                        shortDescription: { type: 'string', example: '15 inch everyday laptop' },
                        description: { type: 'string', example: 'Core i5, 16GB RAM, 512GB SSD' },
                        price: { type: 'number', example: 75000 },
                        discountPrice: { type: 'number', example: 70000 },
                        stock: { type: 'number', example: 12 },
                        images: { type: 'array', items: { $ref: '#/components/schemas/ProductImage' } },
                        category: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0a1' },
                        subCategory: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0a2' },
                        owner: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0a3' },
                        status: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'pending' }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0a1' },
                        name: { type: 'string', example: 'laptop' },
                        status: { type: 'string', enum: ['active', 'pending', 'reject'], example: 'pending' },
                        owner: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0a3' },
                        subCategory: { type: 'array', items: { type: 'string' } }
                    }
                },
                SubCategory: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0a2' },
                        name: { type: 'string', example: 'gaming laptop' },
                        status: { type: 'string', enum: ['active', 'pending', 'reject'], example: 'pending' },
                        parentCategory: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0a1' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '66f1a2b3c4d5e6f7a8b9c0a3' },
                        fullName: { type: 'string', example: 'Anamika Saha' },
                        email: { type: 'string', format: 'email', example: 'test@example.com' },
                        role: { type: 'string', example: 'user' },
                        status: { type: 'string', enum: ['active', 'suspended'], example: 'active' },
                        isVerifed: { type: 'boolean', example: false }
                    }
                }
            }
        }
    },
    apis: [path.join(__dirname, '..', 'routes', '*.js').replace(/\\/g, '/')]
}

module.exports = swaggerJSDoc(swaggerOptions)
