require('node:dns').setServers(['1.1.1.1', '8.8.8.8'])
require('dotenv').config()
const path = require('path')
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
const cors = require('cors')
const dbConnection = require('./config/db')
const { userMiddleware, adminMiddleware, vendorMiddleware } = require('./middlewares/roleMiddlewares')
const authRoutes = require('./routes/authRoutes')
const vendorRoutes = require('./routes/vendorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express()


app.use(express.json())
app.use(cors())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { swaggerOptions: { persistAuthorization: true } }))
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/user', userMiddleware, userRoutes)
app.use('/api/v1/vendor', vendorMiddleware, vendorRoutes)
app.use('/api/v1/admin', adminMiddleware, adminRoutes)
const PORT = process.env.PORT || 8000
dbConnection()

app.listen(PORT, () => { console.log(`Server is running on port: ${PORT}`) })