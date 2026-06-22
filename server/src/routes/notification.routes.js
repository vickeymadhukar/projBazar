// ─────────────────────────────────────────────────────────────────────────────
//  src/routes/notification.routes.js
//  Notification endpoints: Fetch, Mark all as read
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import {
  getMyNotifications,
  readAllNotifications,
} from '../services/notification.service.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getMyNotifications);
router.put('/read-all', readAllNotifications);

export default router;
