// ─────────────────────────────────────────────────────────────────────────────
//  src/models/Review.model.js
//  Buyer reviews seller after transaction is completed
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    // Ensures one review per transaction (no duplicate reviews)
    transaction: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Transaction',
      required: true,
      unique:   true,
    },

    listing: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Listing',
      required: true,
    },

    // The buyer who is leaving the review
    reviewer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // The seller being reviewed
    seller: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    rating: {
      type:     Number,
      required: true,
      min:      1,
      max:      5,
    },

    comment: {
      type:      String,
      maxlength: 1000,
      default:   null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Fetch all reviews for a seller, newest first
reviewSchema.index({ seller: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
