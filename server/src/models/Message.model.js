// ─────────────────────────────────────────────────────────────────────────────
//  src/models/Message.model.js
//  Persisted chat messages — includes text, offers, and system events
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';
import { MESSAGE_TYPES, OFFER_STATUS } from '../constants/index.js';

// ── Offer sub-document (only populated when type === 'offer') ─────────────────
const offerSchema = new mongoose.Schema(
  {
    amount: {
      type:     Number,
      required: true,
      min:      0,
    },

    status: {
      type:    String,
      enum:    Object.values(OFFER_STATUS),
      default: OFFER_STATUS.PENDING,
    },

    // Populated when seller counters the buyer's offer
    counterAmount: {
      type:    Number,
      default: null,
    },
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Conversation',
      required: true,
      index:    true,
    },

    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    text: {
      type:    String,
      default: null,
    },

    type: {
      type:     String,
      enum:     Object.values(MESSAGE_TYPES),
      default:  MESSAGE_TYPES.TEXT,
    },

    // Only present when type === 'offer'
    offer: {
      type:    offerSchema,
      default: null,
    },

    // Tracks which users have seen this message (for unread badge)
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Fetch messages for a conversation, newest first (paginated)
messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
