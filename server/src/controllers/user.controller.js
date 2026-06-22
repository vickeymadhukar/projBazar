// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/user.controller.js
//  Handles: Follow User, Unfollow User, Get Followers, Get Following, Get Users
// ─────────────────────────────────────────────────────────────────────────────
import User from '../models/User.model.js';
import Listing from '../models/Listing.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { publishEvent } from '../services/pubsub.service.js'; // Will create in Step 4, safe mock check for now

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/users/:id/follow
//  Follow a user
// ─────────────────────────────────────────────────────────────────────────────
export const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user._id;

  if (targetId === currentUserId.toString()) {
    throw new ApiError(400, 'You cannot follow yourself');
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    throw new ApiError(404, 'User to follow not found');
  }

  const currentUser = await User.findById(currentUserId);

  // Check if already following
  if (currentUser.following.includes(targetId)) {
    throw new ApiError(400, 'You are already following this user');
  }

  // Update target user's followers
  targetUser.followers.push(currentUserId);
  await targetUser.save();

  // Update current user's following
  currentUser.following.push(targetId);
  await currentUser.save();

  // Publish event for Pub/Sub notification system
  try {
    if (typeof publishEvent === 'function') {
      await publishEvent('user:followed', {
        senderId: currentUserId,
        recipientId: targetId,
        senderName: currentUser.name,
      });
    }
  } catch (err) {
    console.error('Failed to publish follow event:', err.message);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { followersCount: targetUser.followers.length, followingCount: currentUser.following.length },
        `Successfully followed ${targetUser.name}`
      )
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/users/:id/unfollow
//  Unfollow a user
// ─────────────────────────────────────────────────────────────────────────────
export const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user._id;

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    throw new ApiError(404, 'User to unfollow not found');
  }

  const currentUser = await User.findById(currentUserId);

  // Check if not following
  if (!currentUser.following.includes(targetId)) {
    throw new ApiError(400, 'You are not following this user');
  }

  // Remove target user's followers
  targetUser.followers = targetUser.followers.filter(
    (id) => id.toString() !== currentUserId.toString()
  );
  await targetUser.save();

  // Remove current user's following
  currentUser.following = currentUser.following.filter(
    (id) => id.toString() !== targetId.toString()
  );
  await currentUser.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { followersCount: targetUser.followers.length, followingCount: currentUser.following.length },
        `Successfully unfollowed ${targetUser.name}`
      )
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/users/:id/followers
//  Get followers of a user
// ─────────────────────────────────────────────────────────────────────────────
export const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('followers', 'name email avatar bio role');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const list = user.followers.map((f) => {
    return {
      _id: f._id,
      name: f.name,
      email: f.email,
      avatar: f.avatar,
      bio: f.bio,
      role: f.role,
    };
  });

  res.status(200).json(new ApiResponse(200, list, 'Followers list fetched'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/users/:id/following
//  Get users followed by a user
// ─────────────────────────────────────────────────────────────────────────────
export const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('following', 'name email avatar bio role');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const list = user.following.map((f) => {
    return {
      _id: f._id,
      name: f.name,
      email: f.email,
      avatar: f.avatar,
      bio: f.bio,
      role: f.role,
    };
  });

  res.status(200).json(new ApiResponse(200, list, 'Following list fetched'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/users
//  Get all users in the system (useful directory endpoint for sandbox)
// ─────────────────────────────────────────────────────────────────────────────
export const getUsers = asyncHandler(async (req, res) => {
  // Return all users (excluding current user if requested)
  const users = await User.find({}).select('name email avatar bio role followers following');
  const list = users.map((u) => {
    const pub = u.toPublicJSON();
    pub.followers = u.followers || [];
    pub.following = u.following || [];
    return pub;
  });
  res.status(200).json(new ApiResponse(200, list, 'Users directory fetched'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/users/:id
//  Get user details by ID along with their active listings
// ─────────────────────────────────────────────────────────────────────────────
export const getUserById = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  const targetUser = await User.findById(targetId).select('-password');
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  const listings = await Listing.find({ seller: targetId, status: 'available' })
    .populate('seller', 'name email avatar bio role')
    .sort({ createdAt: -1 });

  const pubUser = targetUser.toPublicJSON();
  pubUser.followers = targetUser.followers || [];
  pubUser.following = targetUser.following || [];

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: pubUser,
        listings,
      },
      'User details and projects fetched successfully'
    )
  );
});
