// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/auth.controller.js
//  Handles: Register, Login, Google OAuth callback, Logout,
//           Get Me, Update Profile, Upload Avatar
// ─────────────────────────────────────────────────────────────────────────────
import Joi              from 'joi';
import User             from '../models/User.model.js';
import { generateToken, cookieOptions } from '../utils/jwt.js';
import { uploadFile, deleteFile }        from '../services/storage.service.js';
import ApiError                          from '../utils/ApiError.js';
import ApiResponse                       from '../utils/ApiResponse.js';
import asyncHandler                      from '../utils/asyncHandler.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name:  Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(72)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'number')
    .required()
    .messages({
      'string.pattern.name': 'Password must contain at least one {{#name}} character',
      'string.min': 'Password must be at least 8 characters',
    }),
  age: Joi.number().integer().min(0).max(120).optional(),
  gender: Joi.string().trim().max(50).optional(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100),
  bio:         Joi.string().max(500).allow('', null),
  institution: Joi.string().trim().max(100).allow('', null),
  age:         Joi.number().integer().min(0).max(120).allow(null),
  gender:      Joi.string().trim().max(50).allow('', null),
}).min(1); // at least one field required

// ── Helper: set token cookie + send response ──────────────────────────────────

const sendTokenResponse = (res, user, statusCode, message) => {
  const token = generateToken(user);

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions())
    .json(new ApiResponse(statusCode, user.toPublicJSON(), message));
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/register
//  Create a new account with email + password
// ─────────────────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.context.key, message: d.message }));
    throw new ApiError(400, 'Validation failed', errors);
  }

  const { name, email, password, age, gender } = value;

  // Check for existing user
  const existing = await User.findOne({ email });
  if (existing) {
    // User exists via Google — suggest linking instead
    if (existing.googleId && !existing.password) {
      throw new ApiError(409, 'This email is linked to a Google account. Please sign in with Google.');
    }
    throw new ApiError(409, 'An account with this email already exists.');
  }

  // Create user — password is hashed by pre-save hook in User model
  const user = await User.create({ name, email, password, age, gender });

  sendTokenResponse(res, user, 201, 'Account created successfully! Welcome to ProjBazaar 🎉');
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/login
//  Login with email + password
// ─────────────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.context.key, message: d.message }));
    throw new ApiError(400, 'Validation failed', errors);
  }

  const { email, password } = value;

  // Explicitly select password (it's excluded by default with select: false)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Google-only account — no password set
  if (!user.password) {
    throw new ApiError(401, 'This account uses Google sign-in. Please log in with Google.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  sendTokenResponse(res, user, 200, 'Logged in successfully');
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/google
//  Initiates Google OAuth flow — Passport handles the redirect
//  (actual handler is in routes — this is just a placeholder comment)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/google/callback
//  Called by Passport after Google authentication.
//  req.user is populated by Passport's GoogleStrategy (see config/passport.js)
// ─────────────────────────────────────────────────────────────────────────────
export const googleCallback = asyncHandler(async (req, res) => {
  // req.user is set by Passport strategy
  const user  = req.user;
  const token = generateToken(user);

  // Set HttpOnly cookie
  res.cookie('token', token, cookieOptions());

  // Redirect to frontend — let React handle the post-login UI
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/auth/callback?status=success`);
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/logout
//  Clear the auth cookie
// ─────────────────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (_req, res) => {
  res
    .status(200)
    .cookie('token', '', {
      ...cookieOptions(),
      maxAge: 0,  // immediately expire the cookie
    })
    .json(new ApiResponse(200, null, 'Logged out successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/me
//  Return the currently authenticated user's profile
//  Used by frontend on every page load to restore auth state
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  // req.user is already attached by protect middleware
  res
    .status(200)
    .json(new ApiResponse(200, req.user.toPublicJSON(), 'User profile fetched'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/auth/profile
//  Update name, bio, institution
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.context.key, message: d.message }));
    throw new ApiError(400, 'Validation failed', errors);
  }

  const allowedFields = ['name', 'bio', 'institution', 'age', 'gender'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (value[field] !== undefined) updates[field] = value[field];
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, user.toPublicJSON(), 'Profile updated successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/avatar
//  Upload / replace profile picture (Cloudinary)
//  Expects multipart/form-data with field name: 'avatar'
// ─────────────────────────────────────────────────────────────────────────────
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file provided. Please upload an image.');
  }

  const user = req.user;

  // Delete old avatar from Cloudinary (if exists)
  if (user.avatarPublicId) {
    try {
      await deleteFile(user.avatarPublicId, 'image');
    } catch {
      // Non-fatal — log but continue
      console.warn(`[uploadAvatar] Could not delete old avatar: ${user.avatarPublicId}`);
    }
  }

  // Upload new avatar
  const result = await uploadFile(
    req.file.buffer,
    'projbazaar/avatars',
    'image',
    {
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    }
  );

  // Update user document
  const updated = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        avatar:         result.url,
        avatarPublicId: result.publicId,
      },
    },
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, updated.toPublicJSON(), 'Avatar uploaded successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/auth/change-password
//  Change password (email users only)
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required.');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters.');
  }

  // Fetch with password (excluded by default)
  const user = await User.findById(req.user._id).select('+password');

  if (!user.password) {
    throw new ApiError(400, 'Google sign-in users cannot set a password here.');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.password = newPassword; // pre-save hook will hash it
  await user.save();

  // Issue a new token (good practice after password change)
  sendTokenResponse(res, user, 200, 'Password changed successfully');
});
