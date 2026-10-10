import mongoose from 'mongoose';

const dentistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, default: 'Dental Surgeon' },
    specialization: { type: String, required: true },
    bio: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    qualifications: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    photoUrl: { type: String, default: '' },
    workingDays: {
      type: [String],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    },
    workingHours: {
      start: { type: String, default: '08:30' },
      end: { type: String, default: '17:30' },
    },
    daysOff: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Dentist = mongoose.model('Dentist', dentistSchema);
