// ─────────────────────────────────────────────────────────────────────────────
//  src/routes/listing.routes.js
//  Listing interaction endpoints: Creation, Liking, Liked listings list
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import {
  createListing,
  getListings,
  likeListing,
  getLikedListings,
  addComment,
  getComments,
  deleteComment,
} from '../controllers/listing.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import { redisRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public routes (with optional auth, in case we want to show liked status)
router.get('/', optionalAuth, getListings);
router.get('/:id/comments', optionalAuth, getComments);

// Protected routes
router.post('/', protect, createListing);
router.get('/liked', protect, getLikedListings);
router.post('/:id/like', protect, redisRateLimiter('like', 10, 60), likeListing);
router.post('/:id/comments', protect, redisRateLimiter('comment', 5, 60), addComment);
router.delete('/comments/:commentId', protect, deleteComment);

export default router;
