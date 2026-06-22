// ─────────────────────────────────────────────────────────────────────────────
//  src/services/cloudinary.service.js
//  Cloudinary-specific implementation of file operations
//
//  ⚠️  Do NOT call this directly from controllers.
//  Always go through storage.service.js — that's the abstraction layer.
//  When migrating to S3, only THIS file changes.
// ─────────────────────────────────────────────────────────────────────────────
import { Readable } from 'stream';
import { cloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

/**
 * Uploads a file buffer to Cloudinary using upload_stream.
 *
 * @param {Buffer} buffer       - File buffer from Multer memoryStorage
 * @param {string} folder       - Cloudinary folder path (e.g. 'projbazaar/listings')
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 * @param {object} options      - Extra Cloudinary upload options
 * @returns {Promise<{ url, publicId, resourceType, format, durationSecs, thumbnail }>}
 */
export const uploadToCloudinary = (buffer, folder, resourceType = 'image', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // 'authenticated' = private file (signed URL required to access)
        // Use for delivery files only. Listing images use default 'upload' (public).
        type: options.private ? 'authenticated' : 'upload',
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(500, `Cloudinary upload failed: ${error.message}`));
        }
        resolve({
          url:          result.secure_url,
          publicId:     result.public_id,
          resourceType: result.resource_type,
          format:       result.format,
          durationSecs: result.duration   || null,
          thumbnail:    result.eager?.[0]?.secure_url || null,
        });
      }
    );

    // Convert buffer → readable stream → pipe into Cloudinary upload stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Deletes a file from Cloudinary.
 *
 * @param {string} publicId     - Cloudinary public_id
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new ApiError(500, `Cloudinary deletion failed: ${result.result}`);
    }
    return result;
  } catch (error) {
    throw new ApiError(500, `Cloudinary delete error: ${error.message}`);
  }
};

/**
 * Generates a time-limited signed URL for a private Cloudinary file.
 * Used for delivery file downloads — same concept as S3 presigned URL.
 *
 * @param {string} publicId       - Cloudinary public_id (authenticated type)
 * @param {string} resourceType   - 'raw' | 'image'
 * @param {number} expiresInSecs  - URL validity in seconds (default: 600 = 10 min)
 * @returns {string} Signed URL
 */
export const generateSignedUrl = (publicId, resourceType = 'raw', expiresInSecs = 600) => {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSecs;

  return cloudinary.utils.private_download_url(publicId, null, {
    resource_type: resourceType,
    type:          'authenticated',
    expires_at:    expiresAt,
    attachment:    true,
  });
};
