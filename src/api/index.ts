import { apiClient } from './client.js';

export interface Doctor {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  titlePrefix?: string;
  title: string;
  specialization: string;
  bio: string;
  email: string;
  phone: string;
  qualifications: string;
  experienceYears: number;
  photoUrl: string;
  workingDays: string[];
  workingHours: { start: string; end: string };
  daysOff: string[];
  isActive: boolean;
}

export interface DentalService {
  id: string;
  name: string;
  category: 'general' | 'cosmetic' | 'orthodontics' | 'implants' | 'pediatric' | 'whitening' | 'root_canal' | 'emergency';
  description: string;
  startingPrice: number;
  durationMinutes: number;
  iconName: string;
  isPopular: boolean;
}

export type PaymentMethod = 'cash' | 'telebirr' | 'cbe_birr' | 'bank_transfer';

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientName: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientPhone: string;
  patientEmail?: string;
  dentistId: string;
  dentistName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentMethod?: PaymentMethod;
  notes?: string;
  isWalkIn: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityData {
  date: string;
  dentistId: string;
  dentistName: string;
  isWorkingDay: boolean;
  workingHours?: { start: string; end: string };
  availableSlots: string[];
  bookedSlots: string[];
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  description: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  singleImageUrl?: string;
  isBeforeAfter: boolean;
  sortOrder: number;
  doctorName?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTimeMinutes: number;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  authorName: string;
  authorRole: string;
  authorId?: string;
  publishedAt: string;
  isPublished: boolean;
}

export interface Testimonial {
  id: string;
  patientName: string;
  treatment: string;
  rating: number;
  comment: string;
  date: string;
  isApproved: boolean;
  avatarUrl?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: 'super_admin' | 'doctor_manager' | 'receptionist' | 'doctor';
  doctorId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalDoctors: number;
  totalGalleryUploads: number;
  activeAdminUsers: number;
  todayAppointmentsCount: number;
  totalAppointmentsCount: number;
  confirmedCount: number;
  pendingCount: number;
  completedCount: number;
  popularServices: { name: string; count: number }[];
  unreadMessagesCount: number;
  // Served patients and clinical analytics
  totalCustomersServed: number;
  todayCustomersServed: number;
  monthCustomersServed: number;
  totalRevenueETB: number;
  paymentMethods: Record<string, { count: number; totalETB: number }>;
  monthlyServedTrend: {
    month: string;
    served: number;
    revenue: number;
    newPatients: number;
    satisfaction: number;
  }[];
  treatmentCategories: {
    category: string;
    count: number;
    color: string;
    revenue: number;
  }[];
  doctorCaseload: {
    doctorId: string;
    doctorName: string;
    specialization: string;
    patientsServed: number;
    todayVisits: number;
    rating: number;
    experienceYears: number;
  }[];
  patientSatisfactionRate: number;
  isDemoData?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  userRole: string;
  action: string;
  details: string;
}

export interface PageSeo {
  page: string;
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string;
}

// ================= API Services =================

export const api = {
  // Dentists
  getDentists: async (all: boolean = false): Promise<Doctor[]> => {
    const res = await apiClient.get(`/dentists?all=${all}`);
    return res.data.data;
  },
  getDentistById: async (id: string): Promise<Doctor> => {
    const res = await apiClient.get(`/dentists/${id}`);
    return res.data.data;
  },
  createDentist: async (data: Partial<Doctor>): Promise<Doctor> => {
    const res = await apiClient.post('/dentists', data);
    return res.data.data;
  },
  updateDentist: async (id: string, data: Partial<Doctor>): Promise<Doctor> => {
    const res = await apiClient.put(`/dentists/${id}`, data);
    return res.data.data;
  },
  updateDentistSchedule: async (
    id: string,
    schedule: { workingDays?: string[]; workingHours?: { start: string; end: string }; daysOff?: string[] }
  ): Promise<Doctor> => {
    const res = await apiClient.put(`/dentists/${id}/schedule`, schedule);
    return res.data.data;
  },
  deleteDentist: async (id: string): Promise<void> => {
    await apiClient.delete(`/dentists/${id}`);
  },

  // Services
  getServices: async (): Promise<DentalService[]> => {
    const res = await apiClient.get('/services');
    return res.data.data;
  },
  createService: async (data: Partial<DentalService>): Promise<DentalService> => {
    const res = await apiClient.post('/services', data);
    return res.data.data;
  },
  updateService: async (id: string, data: Partial<DentalService>): Promise<DentalService> => {
    const res = await apiClient.put(`/services/${id}`, data);
    return res.data.data;
  },
  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  },

  // Appointments & Availability
  getAvailability: async (
    dentistId: string,
    date: string,
    duration?: number,
    excludeAppointmentId?: string
  ): Promise<AvailabilityData> => {
    const res = await apiClient.get('/appointments/availability', {
      params: { dentistId, date, duration, excludeAppointmentId },
    });
    return res.data.data;
  },
  bookAppointment: async (payload: {
    patientName?: string;
    patientFirstName?: string;
    patientLastName?: string;
    patientPhone: string;
    patientEmail?: string;
    dentistId: string;
    serviceId: string;
    date: string;
    startTime: string;
    paymentMethod?: PaymentMethod;
    notes?: string;
    isWalkIn?: boolean;
  }): Promise<Appointment> => {
    const res = await apiClient.post('/appointments', payload);
    return res.data.data;
  },
  getAppointments: async (params?: {
    date?: string;
    status?: string;
    dentistId?: string;
    search?: string;
  }): Promise<Appointment[]> => {
    const res = await apiClient.get('/appointments', { params });
    return res.data.data;
  },
  updateAppointment: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
    const res = await apiClient.put(`/appointments/${id}`, data);
    return res.data.data;
  },
  updateAppointmentStatus: async (id: string, status: string): Promise<Appointment> => {
    const res = await apiClient.put(`/appointments/${id}/status`, { status });
    return res.data.data;
  },
  rescheduleAppointment: async (id: string, date: string, startTime: string): Promise<Appointment> => {
    const res = await apiClient.put(`/appointments/${id}/reschedule`, { date, startTime });
    return res.data.data;
  },
  cancelAppointment: async (id: string): Promise<void> => {
    await apiClient.delete(`/appointments/${id}`);
  },

  // Image Upload helper (supports File or Base64 data URL)
  uploadImage: async (fileOrDataUrl: File | string): Promise<string> => {
    if (typeof fileOrDataUrl === 'string') {
      const res = await apiClient.post('/upload', { dataUrl: fileOrDataUrl });
      return res.data.data.url;
    }
    // Read File to Base64 Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const res = await apiClient.post('/upload', {
            dataUrl,
            filename: fileOrDataUrl.name,
          });
          resolve(res.data.data.url);
        } catch (err) {
          // Fallback: return dataUrl directly so preview works even without network
          resolve(reader.result as string);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    });
  },

  // Gallery
  getGallery: async (): Promise<GalleryItem[]> => {
    const res = await apiClient.get('/gallery');
    return res.data.data;
  },
  createGalleryItem: async (data: Partial<GalleryItem>): Promise<GalleryItem> => {
    const res = await apiClient.post('/gallery', data);
    return res.data.data;
  },
  updateGalleryItem: async (id: string, data: Partial<GalleryItem>): Promise<GalleryItem> => {
    const res = await apiClient.put(`/gallery/${id}`, data);
    return res.data.data;
  },
  deleteGalleryItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/gallery/${id}`);
  },

  // Blog / Tips
  getBlogPosts: async (all: boolean = false): Promise<BlogPost[]> => {
    const res = await apiClient.get(`/blog?all=${all}`);
    return res.data.data;
  },
  getBlogPostBySlug: async (slug: string): Promise<BlogPost> => {
    const res = await apiClient.get(`/blog/${slug}`);
    return res.data.data;
  },
  createBlogPost: async (data: Partial<BlogPost>): Promise<BlogPost> => {
    const res = await apiClient.post('/blog', data);
    return res.data.data;
  },
  updateBlogPost: async (id: string, data: Partial<BlogPost>): Promise<BlogPost> => {
    const res = await apiClient.put(`/blog/${id}`, data);
    return res.data.data;
  },
  deleteBlogPost: async (id: string): Promise<void> => {
    await apiClient.delete(`/blog/${id}`);
  },

  // Testimonials
  getTestimonials: async (all: boolean = false): Promise<Testimonial[]> => {
    const res = await apiClient.get(`/testimonials?all=${all}`);
    return res.data.data;
  },
  createTestimonial: async (data: Partial<Testimonial>): Promise<Testimonial> => {
    const res = await apiClient.post('/testimonials', data);
    return res.data.data;
  },
  updateTestimonial: async (id: string, data: Partial<Testimonial>): Promise<Testimonial> => {
    const res = await apiClient.put(`/testimonials/${id}`, data);
    return res.data.data;
  },
  deleteTestimonial: async (id: string): Promise<void> => {
    await apiClient.delete(`/testimonials/${id}`);
  },

  // Contact
  submitContact: async (data: {
    name: string;
    phone: string;
    email?: string;
    subject?: string;
    message: string;
  }): Promise<{ message: string }> => {
    const res = await apiClient.post('/contact', data);
    return res.data;
  },
  getContactMessages: async (): Promise<ContactMessage[]> => {
    const res = await apiClient.get('/contact');
    return res.data.data;
  },
  updateMessageStatus: async (id: string, status: string): Promise<ContactMessage> => {
    const res = await apiClient.put(`/contact/${id}/status`, { status });
    return res.data.data;
  },
  deleteMessage: async (id: string): Promise<void> => {
    await apiClient.delete(`/contact/${id}`);
  },

  // Users & RBAC
  getUsers: async (): Promise<AdminUser[]> => {
    const res = await apiClient.get('/users');
    return res.data.data;
  },
  createUser: async (data: any): Promise<AdminUser> => {
    const res = await apiClient.post('/users', data);
    return res.data.data;
  },
  updateUser: async (id: string, data: any): Promise<AdminUser> => {
    const res = await apiClient.put(`/users/${id}`, data);
    return res.data.data;
  },
  updateUserCredentials: async (
    id: string,
    data: { username?: string; newPassword?: string }
  ): Promise<AdminUser> => {
    const res = await apiClient.put(`/users/${id}/credentials`, data);
    return res.data.data;
  },
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Dashboard & Audit
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data.data;
  },
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await apiClient.get('/audit-logs');
    return res.data.data;
  },

  // SEO
  getSeoSettings: async (): Promise<Record<string, PageSeo>> => {
    const res = await apiClient.get('/seo');
    return res.data.data;
  },
  updateSeoPage: async (page: string, data: Partial<PageSeo>): Promise<PageSeo> => {
    const res = await apiClient.put(`/seo/${page}`, data);
    return res.data.data;
  },
};
