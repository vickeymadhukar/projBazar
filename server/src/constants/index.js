// ─────────────────────────────────────────────────────────────────────────────
//  src/constants/index.js
//  Application-wide enums and constants — single source of truth
//  Import these in models and controllers instead of using raw strings
// ─────────────────────────────────────────────────────────────────────────────

// ── User Roles ────────────────────────────────────────────────────────────────
export const USER_ROLES = Object.freeze({
  BUYER:  'buyer',
  SELLER: 'seller',
  ADMIN:  'admin',
});

// ── Listing Categories (Tech Stack based) ────────────────────────────────────
export const LISTING_CATEGORIES = Object.freeze({
  MERN:       'MERN',
  JAVA:       'Java',
  CPP:        'C++',
  CSHARP:     'C#',
  PYTHON:     'Python',
  JAVASCRIPT: 'JavaScript',
  PHP:        'PHP',
  RUBY:       'Ruby',
  GO:         'Go',
  RUST:       'Rust',
  FLUTTER:    'Flutter',
  REACT:      'React',
  VUE:        'Vue',
  DJANGO:     'Django',
  OTHER:      'Other',
});

// ── Listing Status ────────────────────────────────────────────────────────────
export const LISTING_STATUS = Object.freeze({
  DRAFT:     'draft',
  AVAILABLE: 'available',
  SOLD:      'sold',
  INACTIVE:  'inactive',
});

// ── Conversation Status ───────────────────────────────────────────────────────
export const CONVERSATION_STATUS = Object.freeze({
  ACTIVE:    'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

// ── Message Types ─────────────────────────────────────────────────────────────
export const MESSAGE_TYPES = Object.freeze({
  TEXT:   'text',
  OFFER:  'offer',
  SYSTEM: 'system',
});

// ── Offer Status ──────────────────────────────────────────────────────────────
export const OFFER_STATUS = Object.freeze({
  PENDING:   'pending',
  ACCEPTED:  'accepted',
  REJECTED:  'rejected',
  COUNTERED: 'countered',
});

// ── Transaction Status ────────────────────────────────────────────────────────
export const TRANSACTION_STATUS = Object.freeze({
  PENDING_PAYMENT: 'pending-payment',
  PAYMENT_DONE:    'payment-done',
  DELIVERED:       'delivered',
  COMPLETED:       'completed',
  DISPUTED:        'disputed',
  REFUNDED:        'refunded',
});

// ── Delivery Formats ──────────────────────────────────────────────────────────
export const DELIVERY_FORMATS = Object.freeze({
  ZIP:          'zip',
  PDF:          'pdf',
  DOCX:         'docx',
  GITHUB_LINK:  'github-link',
  GOOGLE_DRIVE: 'google-drive',
});

// ── Upload Limits ─────────────────────────────────────────────────────────────
export const UPLOAD_LIMITS = Object.freeze({
  MAX_IMAGES:        10,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_VIDEOS:        2,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_FILE_SIZE_MB:  50,  // for delivery files
});

// ── Redis Key Prefixes ────────────────────────────────────────────────────────
export const REDIS_KEYS = Object.freeze({
  ONLINE_USERS:    'online-users',        // Hash: userId → socketId
  LISTING_CACHE:   'listing:',            // String: listing:<id>
  LISTINGS_CACHE:  'listings:',           // String: listings:<filterHash>
  USER_CACHE:      'user:',               // String: user:<id>
  CONV_CHANNEL:    'conversation:',       // Pub/Sub channel prefix
});
