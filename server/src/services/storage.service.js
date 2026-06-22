// ─────────────────────────────────────────────────────────────────────────────
//  src/services/storage.service.js
//  ABSTRACTION LAYER for file storage
//
//  Controllers call this file ONLY — never cloudinary.service.js directly.
//  When migrating to S3: swap the internals of this file only.
//  All controllers that call uploadFile(), deleteFile(), getSecureUrl() stay UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateSignedUrl,
} from './cloudinary.service.js';

/**
 * Upload a file buffer to storage.
 *
 * @param {Buffer} buffer       - File buffer (from Multer memoryStorage)
 * @param {string} folder       - Storage folder/path
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 * @param {object} options      - Additional options ({ private: true } for delivery files)
 * @returns {Promise<{ url, publicId, resourceType, format }>}
 */
export const uploadFile = async (buffer, folder, resourceType = 'image', options = {}) => {
  return uploadToCloudinary(buffer, folder, resourceType, options);
};

/**
 * Delete a file from storage by its publicId.
 *
 * @param {string} publicId     - Storage public ID / key
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 * @returns {Promise<void>}
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  return deleteFromCloudinary(publicId, resourceType);
};

/**
 * Generate a time-limited signed/presigned URL for a private file.
 * Used for secure delivery file downloads.
 *
 * @param {string} publicId      - Storage public ID / key
 * @param {string} resourceType  - 'raw' | 'image'
 * @param {number} expiresInSecs - URL validity duration (default: 600s = 10 min)
 * @returns {string} Signed URL (S3: presigned URL | Cloudinary: signed URL)
 */
export const getSecureUrl = (publicId, resourceType = 'raw', expiresInSecs = 600) => {
  return generateSignedUrl(publicId, resourceType, expiresInSecs);
};
