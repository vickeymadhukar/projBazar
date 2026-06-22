// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/listing.controller.js
//  Handles: Create Listing, Get Listings, Like Listing, Get Liked Listings
// ─────────────────────────────────────────────────────────────────────────────
import Listing from '../models/Listing.model.js';
import Comment from '../models/Comment.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { publishEvent } from '../services/pubsub.service.js';

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/listings
//  Create a new project/listing
// ─────────────────────────────────────────────────────────────────────────────
export const createListing = asyncHandler(async (req, res) => {
  const { title, description, category, price, domain, subject, institution, techStack } = req.body;

  if (!title || !description || !category || price === undefined) {
    throw new ApiError(400, 'Title, description, category, and price are required.');
  }

  // Create listing
  const listing = await Listing.create({
    seller: req.user._id,
    title,
    description,
    category,
    price,
    domain: domain || null,
    subject: subject || null,
    institution: institution || null,
    techStack: Array.isArray(techStack) ? techStack : [],
    status: 'available', // auto-publish for testing convenience
  });

  // Publish listing creation event for notifications
  try {
    await publishEvent('listing:published', {
      listingId: listing._id,
      sellerId: req.user._id,
      sellerName: req.user.name,
      title: listing.title,
    });
  } catch (err) {
    console.error('Failed to publish listing:published event:', err.message);
  }

  res
    .status(201)
    .json(new ApiResponse(201, listing, 'Listing created successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/listings
//  Fetch all listings
// ─────────────────────────────────────────────────────────────────────────────
export const getListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ status: 'available' })
    .populate('seller', 'name email avatar bio role')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, listings, 'Listings fetched successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/listings/:id/like
//  Like a listing (No unlike feature)
// ─────────────────────────────────────────────────────────────────────────────
export const likeListing = asyncHandler(async (req, res) => {
  const listingId = req.params.id;
  const currentUserId = req.user._id;

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ApiError(404, 'Project listing not found');
  }

  // Check if already liked
  const alreadyLiked = listing.likes.includes(currentUserId);
  if (alreadyLiked) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { likesCount: listing.likesCount, alreadyLiked: true },
          'You have already liked this project'
        )
      );
  }

  // Add to likes array
  listing.likes.push(currentUserId);
  listing.likesCount = listing.likes.length;
  await listing.save();

  // Publish event for Pub/Sub notification system
  try {
    await publishEvent('listing:liked', {
      listingId: listing._id,
      title: listing.title,
      senderId: currentUserId,
      senderName: req.user.name,
      recipientId: listing.seller, // project owner
    });
  } catch (err) {
    console.error('Failed to publish listing:liked event:', err.message);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likesCount: listing.likesCount, alreadyLiked: false },
        'Project liked successfully'
      )
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/listings/liked
//  Get all listings liked by current user
// ─────────────────────────────────────────────────────────────────────────────
export const getLikedListings = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const listings = await Listing.find({ likes: currentUserId })
    .populate('seller', 'name email avatar bio role')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, listings, 'Liked listings fetched'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/listings/:id/comments
//  Add a comment to a listing
// ─────────────────────────────────────────────────────────────────────────────
export const addComment = asyncHandler(async (req, res) => {
  const listingId = req.params.id;
  const { text } = req.body;

  if (!text || !text.trim()) {
    throw new ApiError(400, 'Comment text is required');
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ApiError(404, 'Project listing not found');
  }

  const comment = await Comment.create({
    listing: listingId,
    user: req.user._id,
    text: text.trim(),
  });

  // Populate user details for returning
  const populatedComment = await Comment.findById(comment._id).populate(
    'user',
    'name email avatar bio role'
  );

  // Publish comment event for notification
  try {
    await publishEvent('comment:created', {
      commentId: comment._id,
      listingId: listing._id,
      title: listing.title,
      senderId: req.user._id,
      senderName: req.user.name,
      recipientId: listing.seller, // project owner
      text: comment.text,
    });
  } catch (err) {
    console.error('Failed to publish comment:created event:', err.message);
  }

  res
    .status(201)
    .json(new ApiResponse(201, populatedComment, 'Comment added successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/listings/:id/comments
//  Get all comments for a listing
// ─────────────────────────────────────────────────────────────────────────────
export const getComments = asyncHandler(async (req, res) => {
  const listingId = req.params.id;

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ApiError(404, 'Project listing not found');
  }

  const comments = await Comment.find({ listing: listingId })
    .populate('user', 'name email avatar bio role')
    .sort({ createdAt: 1 }); // Oldest first

  res.status(200).json(new ApiResponse(200, comments, 'Comments fetched successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/listings/comments/:commentId
//  Delete a comment (Allowed for author, project owner, or admin)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId).populate('listing');
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const currentUserId = req.user._id.toString();
  const commentAuthorId = comment.user.toString();
  const listingOwnerId = comment.listing.seller.toString();
  const userRole = req.user.role;

  // Verify authorization: author, project owner, or admin
  const isAuthorized =
    currentUserId === commentAuthorId ||
    currentUserId === listingOwnerId ||
    userRole === 'admin';

  if (!isAuthorized) {
    throw new ApiError(403, 'You are not authorized to delete this comment');
  }

  await Comment.findByIdAndDelete(commentId);

  res.status(200).json(new ApiResponse(200, null, 'Comment deleted successfully'));
});
