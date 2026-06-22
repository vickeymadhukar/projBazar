// ─────────────────────────────────────────────────────────────────────────────
//  src/models/Notification.model.js
//  Notification Schema for User Updates
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    type: {
      type:     String,
      enum:     ['new_listing', 'new_follow', 'new_comment', 'listing_like'],
      required: true,
    },
    message: {
      type:     String,
      required: true,
    },
    referenceId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: false, // can refer to Listing or Comment depending on context
    },
    isRead: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index to fetch unread notifications quickly
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
