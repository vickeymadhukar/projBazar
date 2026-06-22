// ─────────────────────────────────────────────────────────────────────────────
//  src/models/Conversation.model.js
//  One conversation per (listing + buyer) pair — enforced by unique compound index
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';
import { CONVERSATION_STATUS } from '../constants/index.js';

const conversationSchema = new mongoose.Schema(
  {
    listing: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Listing',
      required: true,
    },

    buyer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    seller: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // Cached from the last message — avoids extra lookup in conversation list view
    lastMessage: {
      type:    String,
      default: null,
    },

    lastMessageAt: {
      type:    Date,
      default: null,
    },

    status: {
      type:    String,
      enum:    Object.values(CONVERSATION_STATUS),
      default: CONVERSATION_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Unique: ensures only one conversation per buyer per listing
conversationSchema.index({ listing: 1, buyer: 1 }, { unique: true });
// For fetching "all my conversations" sorted by latest message
conversationSchema.index({ buyer: 1,  lastMessageAt: -1 });
conversationSchema.index({ seller: 1, lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
