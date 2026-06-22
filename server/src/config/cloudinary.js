// ─────────────────────────────────────────────────────────────────────────────
//  src/config/cloudinary.js
//  Cloudinary v2 SDK initialisation
// ─────────────────────────────────────────────────────────────────────────────
import { v2 as cloudinary } from 'cloudinary';

/**
 * Configures the Cloudinary SDK with credentials from environment variables.
 * Called once during app startup (imported by app.js).
 *
 * NOTE: This is configuration only.
 * Actual upload/delete/url logic lives in services/cloudinary.service.js
 * so it can be swapped out for S3 later without touching any controllers.
 */
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true, // always use HTTPS URLs
  });

  console.log('✅ Cloudinary configured');
};

export { cloudinary };
export default configureCloudinary;
