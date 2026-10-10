import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';

// Layout components
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { AdminLayout } from './components/admin/AdminLayout.js';

// Public pages
import { Home } from './pages/public/Home.js';
import { ServicesPage } from './pages/public/Services.js';
import { AboutPage } from './pages/public/About.js';
import { GalleryPage } from './pages/public/Gallery.js';
import { BlogPage } from './pages/public/Blog.js';
import { BlogDetailPage } from './pages/public/BlogDetail.js';
import { ContactPage } from './pages/public/Contact.js';
import { BookAppointmentPage } from './pages/public/BookAppointment.js';

// Admin pages
import { AdminLoginPage } from './pages/admin/AdminLogin.js';
import { DashboardOverview } from './pages/admin/DashboardOverview.js';
import { AppointmentsManager } from './pages/admin/AppointmentsManager.js';
import { DoctorsManager } from './pages/admin/DoctorsManager.js';
import { ServicesManager } from './pages/admin/ServicesManager.js';
import { GalleryManager } from './pages/admin/GalleryManager.js';
import { DentalTipsManager } from './pages/admin/DentalTipsManager.js';
import { ScheduleManager } from './pages/admin/ScheduleManager.js';
import { MessagesManager } from './pages/admin/MessagesManager.js';
import { UsersManager } from './pages/admin/UsersManager.js';
import { SeoManager } from './pages/admin/SeoManager.js';
import { AuditLogsManager } from './pages/admin/AuditLogsManager.js';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs">
        Checking session credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && user.role !== 'super_admin' && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            Your staff account ({user.role}) does not have permission to access this module.
          </p>
          <a
            href="/admin/dashboard"
            className="inline-block mt-3 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Public Layout Wrapper
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Clinic Website */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <Home />
                </PublicLayout>
              }
            />
            <Route
              path="/services"
              element={
                <PublicLayout>
                  <ServicesPage />
                </PublicLayout>
              }
            />
            <Route
              path="/about"
              element={
                <PublicLayout>
                  <AboutPage />
                </PublicLayout>
              }
            />
            <Route
              path="/gallery"
              element={
                <PublicLayout>
                  <GalleryPage />
                </PublicLayout>
              }
            />
            <Route
              path="/blog"
              element={
                <PublicLayout>
                  <BlogPage />
                </PublicLayout>
              }
            />
            <Route
              path="/blog/:slug"
              element={
                <PublicLayout>
                  <BlogDetailPage />
                </PublicLayout>
              }
            />
            <Route
              path="/contact"
              element={
                <PublicLayout>
                  <ContactPage />
                </PublicLayout>
              }
            />
            <Route
              path="/book"
              element={
                <PublicLayout>
                  <BookAppointmentPage />
                </PublicLayout>
              }
            />

            {/* Admin Staff Authentication */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Admin & Staff CMS Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardOverview />} />
              <Route path="appointments" element={<AppointmentsManager />} />
              <Route
                path="doctors"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'doctor_manager']}>
                    <DoctorsManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="services"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'doctor_manager']}>
                    <ServicesManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="gallery"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'doctor_manager']}>
                    <GalleryManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="blog-tips"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'doctor', 'doctor_manager']}>
                    <DentalTipsManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="schedules"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'doctor_manager']}>
                    <ScheduleManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="messages"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'doctor_manager', 'receptionist']}>
                    <MessagesManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <UsersManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="seo"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SeoManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AuditLogsManager />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 Fallback */}
            <Route
              path="*"
              element={
                <PublicLayout>
                  <div className="py-32 text-center">
                    <h2 className="text-3xl font-bold text-slate-800 font-display">Page Not Found</h2>
                    <p className="text-sm text-slate-500 mt-2">
                      The page you are looking for does not exist.
                    </p>
                    <a
                      href="/"
                      className="inline-block mt-4 text-xs font-semibold text-white bg-sky-600 px-5 py-2.5 rounded-xl shadow-sm"
                    >
                      Return Home
                    </a>
                  </div>
                </PublicLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
