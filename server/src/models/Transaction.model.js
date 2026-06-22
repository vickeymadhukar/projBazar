// ─────────────────────────────────────────────────────────────────────────────
//  src/models/Transaction.model.js
//  Tracks payment, delivery, and confirmation lifecycle per agreed deal
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';
import { TRANSACTION_STATUS } from '../constants/index.js';

// ── Delivery File sub-document ────────────────────────────────────────────────
// Seller uploads after payment. We only store Cloudinary publicId here —
// actual download URL is generated on-demand (signed/expiring) via storage.service.js
const deliveryFileSchema = new mongoose.Schema(
  {
    publicId:     { type: String, required: true }, // Cloudinary public_id
    resourceType: { type: String, required: true }, // 'raw' | 'image'
    format:       { type: String, required: true }, // 'zip', 'pdf', etc.
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema(
  {
    conversation: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Conversation',
      required: true,
    },

    listing: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Listing',
      required: true,
    },

    buyer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    seller: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // Price buyer and seller agreed on in chat
    agreedPrice: {
      type:     Number,
      required: true,
      min:      0,
    },

    // Platform commission (e.g. 5% of agreedPrice) — calculated server-side
    platformFee: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // agreedPrice - platformFee — what the seller actually receives
    sellerPayout: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Razorpay ──────────────────────────────────────────────────────────────
    razorpayOrderId: {
      type:    String,
      default: null,
    },

    razorpayPaymentId: {
      type:    String,
      default: null,
    },

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING_PAYMENT,
      index:   true,
    },

    // Uploaded by seller after payment confirmed
    deliveryFile: {
      type:    deliveryFileSchema,
      default: null,
    },

    deliveryConfirmedAt: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
transactionSchema.index({ buyer: 1,  status: 1 });
transactionSchema.index({ seller: 1, status: 1 });
transactionSchema.index({ listing: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
