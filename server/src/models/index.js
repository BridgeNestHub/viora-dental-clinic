import mongoose from 'mongoose';

// Service Schema
const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'cosmetic', 'orthodontics', 'implants', 'pediatric', 'whitening', 'root_canal', 'emergency'],
      default: 'general',
    },
    description: { type: String, default: '' },
    startingPrice: { type: Number, required: true }, // ETB
    durationMinutes: { type: Number, default: 30 },
    iconName: { type: String, default: 'Sparkles' },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);

// BlogPost Schema
const blogPostSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, default: 'Dental Health Tips' },
    readTimeMinutes: { type: Number, default: 4 },
    excerpt: { type: String, default: '' },
    content: { type: String, required: true },
    coverImageUrl: { type: String, default: '' },
    authorName: { type: String, required: true },
    authorRole: { type: String, default: 'Dental Surgeon' },
    publishedAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);

// GalleryItem Schema
const galleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, default: 'Veneers & Aesthetics' },
    description: { type: String, default: '' },
    beforeImageUrl: { type: String, default: null },
    afterImageUrl: { type: String, default: null },
    singleImageUrl: { type: String, default: null },
    isBeforeAfter: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 1 },
    doctorName: { type: String, default: null },
  },
  { timestamps: true }
);

export const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema);

// Testimonial Schema
const testimonialSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    treatment: { type: String, default: 'Clinical Care' },
    rating: { type: Number, default: 5 },
    comment: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);

// ContactMessage Schema
const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: null },
    subject: { type: String, default: 'Inquiry' },
    message: { type: String, required: true },
    status: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread' },
  },
  { timestamps: true }
);

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

// AuditLog Schema
const auditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
