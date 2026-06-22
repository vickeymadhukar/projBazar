// ─────────────────────────────────────────────────────────────────────────────
//  src/models/Comment.model.js
//  Comment Schema for Project Listings
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    listing: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Listing',
      required: true,
      index:    true,
    },
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    text: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
