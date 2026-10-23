const multer = require('multer')
const path = require('path')
const fs = require('fs')

const uploadDir = path.join(__dirname, '..', 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {

        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-')
        cb(null, `${Date.now()}-${safeName}`)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true)
    cb(new Error('Only image files are allowed'))
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB per image
})

module.exports = upload