// ─────────────────────────────────────────────────────────────────────────────
//  src/routes/user.routes.js
//  User interaction endpoints: Follow, Unfollow, Fetch Connections, Users Directory
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUsers,
  getUserById,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { redisRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Apply protect middleware to all routes in this file
router.use(protect);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/:id/follow', redisRateLimiter('follow', 5, 60), followUser);
router.post('/:id/unfollow', unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

export default router;
