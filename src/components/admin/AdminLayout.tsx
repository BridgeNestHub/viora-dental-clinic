import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  UserCheck,
  Stethoscope,
  Images,
  BookOpen,
  MessageSquare,
  Clock,
  Users,
  Settings2,
  FileText,
  LogOut,
  User,
  Key,
  ShieldCheck,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react';
import { VioraLogo } from '../common/VioraLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminLayout: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Profile update form state
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = () => {
    logout();
    success('Logged out successfully.');
    navigate('/admin/login');
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const res = await updateProfile({
      username: editUsername,
      fullName: editFullName,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    });
    setIsUpdating(false);

    if (res.success) {
      success('Profile credentials updated successfully!');
      setProfileModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    } else {
      error(res.message || 'Failed to update credentials.');
    }
  };

  // Role-based navigation items
  const userRole = user?.role || 'receptionist';

  const navItems = [
    {
      label: 'Overview',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'doctor_manager', 'receptionist', 'doctor'],
    },
    {
      label: 'Appointments',
      path: '/admin/appointments',
      icon: CalendarCheck,
      roles: ['super_admin', 'doctor_manager', 'receptionist', 'doctor'],
    },
    {
      label: 'Doctor Profiles',
      path: '/admin/doctors',
      icon: UserCheck,
      roles: ['super_admin', 'doctor_manager'],
    },
    {
      label: 'Clinical Services',
      path: '/admin/services',
      icon: Stethoscope,
      roles: ['super_admin', 'doctor_manager'],
    },
    {
      label: 'Before & After Gallery',
      path: '/admin/gallery',
      icon: Images,
      roles: ['super_admin', 'doctor_manager'],
    },
    {
      label: 'Dental Tips / Blog',
      path: '/admin/blog-tips',
      icon: BookOpen,
      roles: ['super_admin', 'doctor', 'doctor_manager'],
    },
    {
      label: 'Doctor Schedules',
      path: '/admin/schedules',
      icon: Clock,
      roles: ['super_admin', 'doctor_manager'],
    },
    {
      label: 'Patient Inquiries',
      path: '/admin/messages',
      icon: MessageSquare,
      roles: ['super_admin', 'doctor_manager', 'receptionist'],
    },
    {
      label: 'Staff Accounts (RBAC)',
      path: '/admin/users',
      icon: Users,
      roles: ['super_admin'],
    },
    {
      label: 'SEO & Metadata',
      path: '/admin/seo',
      icon: Settings2,
      roles: ['super_admin'],
    },
    {
      label: 'System Audit Logs',
      path: '/admin/audit-logs',
      icon: FileText,
      roles: ['super_admin'],
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(userRole));

  const roleColors: Record<string, string> = {
    super_admin: 'bg-rose-50 text-rose-700 border-rose-200',
    doctor_manager: 'bg-purple-50 text-purple-700 border-purple-200',
    receptionist: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    doctor: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <VioraLogo size="sm" variant="light" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 border-r border-slate-800 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo */}
          <div className="px-2 pt-2">
            <Link to="/" className="inline-block" title="Back to public site">
              <VioraLogo size="md" variant="light" />
            </Link>
          </div>

          {/* User badge */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-xs font-bold text-white truncate">{user?.fullName}</div>
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                  roleColors[userRole] || 'bg-slate-700 text-slate-300'
                }`}
              >
                {userRole.replace('_', ' ')}
              </span>
              <button
                onClick={() => {
                  setEditUsername(user?.username || '');
                  setEditFullName(user?.fullName || '');
                  setProfileModalOpen(true);
                }}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
              >
                <Key className="w-3 h-3" />
                <span>Credentials</span>
              </button>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {allowedNav.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>← View Public Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-slate-100 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30">
          <div>
            <h1 className="text-base font-bold text-slate-900 font-display">
              Viora Dental Management Portal
            </h1>
            <p className="text-xs text-slate-500">
              Session active: <span className="font-semibold text-slate-700">{user?.username}</span> (
              {userRole.replace('_', ' ')})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditUsername(user?.username || '');
                setEditFullName(user?.fullName || '');
                setProfileModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>Change My Password / Username</span>
            </button>
          </div>
        </header>

        {/* Content body */}
        <div className="p-6 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Change Credentials Profile Modal (Requirements #7) */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Update Account Credentials
                </h3>
                <p className="text-xs text-slate-500">
                  Change your username, display name, or password.
                </p>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Username
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Change Password (Optional — leave blank to keep current)
                </span>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password if changing"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
                >
                  {isUpdating ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
