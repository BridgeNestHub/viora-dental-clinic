import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Dentist } from '../models/Dentist.js';
import { Service, BlogPost, GalleryItem, Testimonial, ContactMessage } from '../models/index.js';

async function seedDatabase() {
  await connectDB();
  console.log('[Seed] Seeding Viora Dental Center sample data...');

  // Clear existing
  await User.deleteMany({});
  await Dentist.deleteMany({});
  await Service.deleteMany({});
  await BlogPost.deleteMany({});
  await GalleryItem.deleteMany({});
  await Testimonial.deleteMany({});
  await ContactMessage.deleteMany({});

  // Seed Dentists
  const drSelamawit = await Dentist.create({
    name: 'Dr. Selamawit Bekele',
    title: 'Lead Aesthetic & Implant Dentist',
    specialization: 'Cosmetic Dentistry & Implantology',
    bio: 'Dr. Selamawit has over 14 years of clinical experience specializing in porcelain veneers, digital smile design, and guided implant surgery.',
    email: 'selamawit@vioradental.com',
    phone: '+251 911 234 567',
    qualifications: 'DDS, MSc Aesthetic Dentistry (Frankfurt), Fellow ICOI',
    experienceYears: 14,
    photoUrl: '/src/assets/images/viora_dentist_doctor_1791308053834.jpg',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    workingHours: { start: '08:30', end: '17:30' },
  });

  const drAmanuel = await Dentist.create({
    name: 'Dr. Amanuel Tadesse',
    title: 'Senior Specialist Orthodontist',
    specialization: 'Orthodontics & Clear Aligners',
    bio: 'Certified Invisalign Diamond provider and expert in interceptive pediatric orthodontics and adult bite alignment.',
    email: 'amanuel@vioradental.com',
    phone: '+251 911 345 678',
    qualifications: 'BDS, MOrth RCSEd (UK)',
    experienceYears: 11,
    photoUrl: '/src/assets/images/viora_smile_consultation_1791308064299.jpg',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: { start: '09:00', end: '18:00' },
  });

  // Seed Users
  await User.create([
    {
      username: 'superadmin',
      fullName: 'Dr. Selamawit Bekele (Lead Director)',
      email: 'admin@vioradental.com',
      password: 'Admin@123',
      role: 'super_admin',
    },
    {
      username: 'doc_manager',
      fullName: 'Dawit Yohannes',
      email: 'manager@vioradental.com',
      password: 'Staff@123',
      role: 'doctor_manager',
    },
    {
      username: 'reception',
      fullName: 'Hanan Mohammed',
      email: 'frontdesk@vioradental.com',
      password: 'Staff@123',
      role: 'receptionist',
    },
    {
      username: 'dr_selamawit',
      fullName: 'Dr. Selamawit Bekele',
      email: 'selamawit@vioradental.com',
      password: 'Staff@123',
      role: 'doctor',
      doctorId: drSelamawit._id,
    },
  ]);

  // Seed Services
  await Service.create([
    {
      name: 'Comprehensive Oral Exam & 3D Scan',
      category: 'general',
      description: 'Complete digital panoramic and bitewing imaging with oral cancer screening and customized treatment planning roadmap.',
      startingPrice: 1200,
      durationMinutes: 30,
      isPopular: true,
    },
    {
      name: 'Porcelain Veneers & Smile Makeover',
      category: 'cosmetic',
      description: 'Ultra-thin custom E.max porcelain laminates crafted to correct tooth discoloration, chips, gaps, and symmetry.',
      startingPrice: 16000,
      durationMinutes: 60,
      isPopular: true,
    },
    {
      name: 'Precision Computer-Guided Dental Implants',
      category: 'implants',
      description: 'Permanent titanium root replacement with 3D guided computer placement and zirconia crown.',
      startingPrice: 32000,
      durationMinutes: 60,
      isPopular: true,
    },
  ]);

  console.log('[Seed] Database seeded successfully! Admin user: superadmin / Admin@123');
  process.exit(0);
}

seedDatabase().catch((e) => {
  console.error('[Seed] Error seeding DB:', e);
  process.exit(1);
});
