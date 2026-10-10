import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, CalendarCheck, ShieldCheck } from 'lucide-react';
import { VioraLogo } from '../common/VioraLogo.js';
import { useAuth } from '../../context/AuthContext.js';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Specialists', path: '/about' },
    { label: 'Smile Gallery', path: '/gallery' },
    { label: 'Dental Tips', path: '/blog' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Zone 1: Single Brand element */}
        <Link to="/" className="shrink-0 flex items-center group">
          <VioraLogo size="md" variant="brand" />
        </Link>

        {/* Zone 2: 4-6 Clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors py-1 relative hover:text-sky-600 whitespace-nowrap ${
                isActive(link.path)
                  ? 'text-sky-600 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-600 after:rounded-full'
                  : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: 1-2 Primary actions */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {/* {user ? (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-sky-700 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Admin Portal ({user.role.replace('_', ' ')})</span>
            </Link>
          ) : (
            <Link
              to="/admin/login"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors px-2 py-1"
            >
              Staff Portal
            </Link>
          )} */}

          <Link
            to="/book"
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-sky-500/20 whitespace-nowrap"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Book an Appointment</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            to="/book"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg whitespace-nowrap"
          >
            Book Visit
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-sky-600 rounded-xl text-center shadow-sm"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Book Appointment Online</span>
            </Link>

            {/* {user ? (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-xl text-center"
              >
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Go to Admin Panel</span>
              </Link>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                Staff Portal Login
              </Link>
            )} */}
          </div>
        </div>
      )}
    </header>
  );
};
