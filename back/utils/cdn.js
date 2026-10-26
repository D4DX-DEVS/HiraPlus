const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS with DO Spaces
AWS.config.update({
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET
});

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    region: 'blr1'
});

// Configure multer for file upload
const upload = multer({
    limits: {
        fileSize: parseInt(process.env.DO_MAX_FILE_SIZE) || 5242880 // 5MB default
    },
    fileFilter: (req, file, cb) => {
        // Accept only images
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WEBP images are allowed.'), false);
        }
    },
    storage: multerS3({
        s3: s3,
        bucket: process.env.DO_SPACES_BUCKET,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            // Create clean filename
            const fileName = file.originalname.toLowerCase().split(' ').join('-');
            const fileExt = path.extname(fileName);
            const baseFileName = path.basename(fileName, fileExt);
            const finalFileName = `${baseFileName}-${Date.now()}${fileExt}`;
            
            // Use the configured folder from env
            const folder = process.env.DO_SPACES_FOLDER.replace(/\s+/g, '-').toLowerCase();
            const fullPath = `${folder}/${finalFileName}`;
            
            cb(null, fullPath);
        }
    })
});

// Function to delete file from CDN
const deleteFile = async (fileKey) => {
    try {
        await new Promise((resolve, reject) => {
            s3.deleteObject({
                Bucket: process.env.DO_SPACES_BUCKET,
                Key: fileKey
            }, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
        return true;
    } catch (error) {
        console.error('Error deleting file from CDN:', error);
        return false;
    }
};

// Extract file key from CDN URL
const getFileKeyFromUrl = (url) => {
    if (!url) return null;
    const cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT;
    return url.replace(`${cdnEndpoint}/`, '');
};

module.exports = {
    upload,
    deleteFile,
    getFileKeyFromUrl
}; 