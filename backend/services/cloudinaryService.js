const cloudinary = require('../config/cloudinary');

/**
 * Upload a single buffer to Cloudinary using base64 data URI.
 * @param {Buffer} buffer
 * @param {string} folder
 * @param {string} [publicId]
 * @param {string} [mimetype]  — MIME type of the file (e.g. 'image/png')
 */
const uploadBuffer = async (buffer, folder, publicId, mimetype = 'image/jpeg') => {
  const b64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(b64, {
    folder,
    public_id: publicId,
    resource_type: 'image',
    quality: 'auto',
    fetch_format: 'auto',
  });
  return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Upload multiple multer files to Cloudinary.
 * @param {Express.Multer.File[]} files
 * @param {string} folder
 */
const uploadMultiple = async (files, folder) => {
  return Promise.all(files.map((f) => uploadBuffer(f.buffer, folder)));
};

/**
 * Delete multiple Cloudinary assets by publicId.
 * @param {string[]} publicIds
 */
const deleteMultiple = async (publicIds) => {
  return Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id)));
};

module.exports = { uploadBuffer, uploadMultiple, deleteMultiple };
