// ─────────────────────────────────────────────────────────────────────────────
//  src/models/User.model.js
//  Self-hosted auth — JWT + Google OAuth
//  Supports: email/password registration AND Google OAuth sign-in
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../constants/index.js';

const userSchema = new mongoose.Schema(
  {
    // ── Identity ───────────────────────────────────────────────────────────────
    name: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 100,
    },

    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    // Hashed password — null for Google OAuth users who never set a password
    password: {
      type:   String,
      select: false,   // NEVER returned in queries unless explicitly requested
      default: null,
    },

    // Google OAuth user ID — null for email/password users
    googleId: {
      type:    String,
      unique:  true,
      sparse:  true,   // sparse=true allows multiple undefined values (non-Google users)
    },

    // ── Profile ────────────────────────────────────────────────────────────────
    // Cloudinary URL for profile picture
    avatar: {
      type:    String,
      default: null,
    },

    // Cloudinary publicId for avatar (needed for deletion before re-upload)
    avatarPublicId: {
      type:    String,
      default: null,
    },

    bio: {
      type:      String,
      maxlength: 500,
      default:   null,
    },

    // College/school name — used to filter listings by institution
    institution: {
      type:  String,
      trim:  true,
      default: null,
    },

    age: {
      type:    Number,
      default: 18,
      min:     0,
    },

    gender: {
      type:    String,
      default: 'Not Specified',
      trim:    true,
    },

    // ── Authorization ──────────────────────────────────────────────────────────
    role: {
      type:    String,
      enum:    Object.values(USER_ROLES),
      default: USER_ROLES.BUYER,
    },

    // Admin-granted badge for trusted sellers
    isVerifiedSeller: {
      type:    Boolean,
      default: false,
    },

    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    }],

    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    }],

    // ── Marketplace Stats (denormalized) ──────────────────────────────────────
    // Updated via post-save hooks when a Review or Transaction is created/completed
    razorpayAccountId: {
      type:    String,
      default: null,
    },

    totalSales: {
      type:    Number,
      default: 0,
      min:     0,
    },

    averageRating: {
      type:    Number,
      default: 0,
      min:     0,
      max:     5,
    },

    reviewCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Hash password before saving (only if password was changed)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt   = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Methods ──────────────────────────────────────────────────────────

/**
 * Compare a plain-text password against the stored hash.
 * Usage: const ok = await user.comparePassword('mypassword');
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google-only user has no password
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Return a safe user object for JWT payload and API responses.
 * Strips password, avatarPublicId, and other internal fields.
 */
userSchema.methods.toPublicJSON = function () {
  return {
    _id:              this._id,
    name:             this.name,
    email:            this.email,
    avatar:           this.avatar,
    bio:              this.bio,
    institution:      this.institution,
    age:              this.age,
    gender:           this.gender,
    role:             this.role,
    isVerifiedSeller: this.isVerifiedSeller,
    averageRating:    this.averageRating,
    reviewCount:      this.reviewCount,
    totalSales:       this.totalSales,
    followers:        this.followers || [],
    following:        this.following || [],
    createdAt:        this.createdAt,
  };
};

// ── Indexes ───────────────────────────────────────────────────────────────────
// Note: email index is already created by unique:true on the field definition
// Only add indexes here that are NOT already declared inline
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
