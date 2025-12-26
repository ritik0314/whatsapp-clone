const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinary = (file) => {
  if (!file || !file.mimetype) {
    return Promise.reject(new Error('Invalid file'));
  }

  const isVideo = file.mimetype.startsWith('video');
  const options = { resource_type: isVideo ? 'video' : 'image' };

  const uploader = isVideo
    ? cloudinary.uploader.upload_large
    : cloudinary.uploader.upload;

  return new Promise((resolve, reject) => {
    uploader(file.path, options, (error, result) => {
      // Clean up temp file after upload
      fs.unlink(file.path, () => {});

      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
};

const multerMiddleware = multer({ dest: 'uploads/' }).single('media');

module.exports = {
  uploadFileToCloudinary,
  multerMiddleware,
};

