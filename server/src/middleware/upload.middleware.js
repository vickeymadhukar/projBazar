// ─────────────────────────────────────────────────────────────────────────────
//  src/middleware/upload.middleware.js
//  Multer configuration using memoryStorage
//  Files are held in memory (Buffer) then streamed to Cloudinary — no disk I/O
// ─────────────────────────────────────────────────────────────────────────────
import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import { UPLOAD_LIMITS } from '../constants/index.js';

const MB = 1024 * 1024;

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_DOC_TYPES   = ['application/pdf', 'application/zip',
                              'application/x-zip-compressed',
                              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// ── Storage: memory (no temp files on disk) ───────────────────────────────────
const storage = multer.memoryStorage();

// ── File filter ───────────────────────────────────────────────────────────────
const fileFilter = (allowedTypes) => (_req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type not allowed: ${file.mimetype}`), false);
  }
};

// ── Multer instances ──────────────────────────────────────────────────────────

/**
 * For listing image uploads (up to 10 images, 5 MB each)
 */
export const uploadImages = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB * MB },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
}).array('images', UPLOAD_LIMITS.MAX_IMAGES);

/**
 * For listing video uploads (up to 2 videos, 100 MB each)
 */
export const uploadVideos = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMITS.MAX_VIDEO_SIZE_MB * MB },
  fileFilter: fileFilter(ALLOWED_VIDEO_TYPES),
}).array('videos', UPLOAD_LIMITS.MAX_VIDEOS);

/**
 * For delivery file upload (single file — zip, pdf, docx)
 */
export const uploadDeliveryFile = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE_MB * MB },
  fileFilter: fileFilter([...ALLOWED_DOC_TYPES, ...ALLOWED_IMAGE_TYPES]),
}).single('deliveryFile');

/**
 * For avatar / single image upload
 */
export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB * MB },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
}).single('avatar');
