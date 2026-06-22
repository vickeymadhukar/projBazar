// ─────────────────────────────────────────────────────────────────────────────
//  src/services/notification.service.js
//  Processes events and manages user notification records & socket emits
// ─────────────────────────────────────────────────────────────────────────────
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { getIO } from '../socket/index.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * handleSystemEvent — subscription callback that processes system-wide broker events
 * @param {string} event - event name
 * @param {object} data - payload data
 */
export const handleSystemEvent = async (event, data) => {
  console.log(`🔔 [Notification Service] Processing event "${event}"`, data);

  try {
    const io = getIO();

    if (event === 'listing:published') {
      const { listingId, sellerId, sellerName, title } = data;

      // Find all followers of the seller
      const seller = await User.findById(sellerId);
      if (!seller || !seller.followers || seller.followers.length === 0) {
        return;
      }

      const notifications = seller.followers.map((followerId) => ({
        recipient: followerId,
        sender: sellerId,
        type: 'new_listing',
        message: `${sellerName} published a new project: "${title}"`,
        referenceId: listingId,
      }));

      // Bulk write notifications to database
      const createdDocs = await Notification.insertMany(notifications);

      // Emit to online followers
      if (io) {
        createdDocs.forEach((doc) => {
          io.to(`user:${doc.recipient.toString()}`).emit('new-notification', doc);
        });
      }
    } 

    else if (event === 'user:followed') {
      const { senderId, recipientId, senderName } = data;

      const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'new_follow',
        message: `${senderName} started following you`,
        referenceId: senderId,
      });

      if (io) {
        io.to(`user:${recipientId}`).emit('new-notification', notification);
      }
    } 

    else if (event === 'listing:liked') {
      const { listingId, title, senderId, senderName, recipientId } = data;

      // Don't notify self
      if (senderId.toString() === recipientId.toString()) return;

      const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'listing_like',
        message: `${senderName} liked your project: "${title}"`,
        referenceId: listingId,
      });

      if (io) {
        io.to(`user:${recipientId}`).emit('new-notification', notification);
      }
    } 

    else if (event === 'comment:created') {
      const { listingId, title, senderId, senderName, recipientId } = data;

      // Don't notify self
      if (senderId.toString() === recipientId.toString()) return;

      const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'new_comment',
        message: `${senderName} commented on your project: "${title}"`,
        referenceId: listingId,
      });

      if (io) {
        io.to(`user:${recipientId}`).emit('new-notification', notification);
      }
    }
  } catch (err) {
    console.error('❌ Failed to process notification for event:', event, err.message);
  }
};

// ── Express Controller Handlers ──────────────────────────────────────────────

// GET /api/notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(50);

  res
    .status(200)
    .json(new ApiResponse(200, notifications, 'Notifications fetched successfully'));
});

// PUT /api/notifications/read-all
export const readAllNotifications = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});
