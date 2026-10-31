const multer = require('multer')
const path = require('path')
const fs = require('fs')

// uploaded Excel sheets are kept in the "files" folder
const sheetDir = path.join(__dirname, '..', 'files')
fs.mkdirSync(sheetDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, sheetDir),
    filename: (req, file, cb) => {
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-')
        cb(null, `${Date.now()}-${cleanName}`)
    }
})

const fileFilter = (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.xlsx') return cb(null, true)
    cb(new Error('Only .xlsx files are allowed'))
}

const excelUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
})

module.exports = excelUpload
