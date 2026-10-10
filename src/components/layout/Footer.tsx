import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';
import { VioraLogo } from '../common/VioraLogo.js';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand & Promise */}
          <div className="space-y-4">
            <VioraLogo size="md" variant="light" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Viora Dental Center is Addis Ababa's premier dental clinic delivering painless, digital, and transformative aesthetic dentistry in an ultra-hygienic clinical sanctuary.
            </p>
            {/* <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified European & International Standards</span>
            </div> */}
          </div>

          {/* Col 2: Clinical Services */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Clinical Specializations
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Porcelain Veneers & Smile Makeovers
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Computer-Guided Dental Implants
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Clear Aligners & Orthodontics
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  In-Office Laser Teeth Whitening
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Microscopic Root Canal Therapy
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Pediatric & Gentle Family Dentistry
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours & Emergency */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Clinic Working Hours
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white block font-medium">Monday – Friday</span>
                  <span className="text-xs">8:30 AM – 6:30 PM (EAT)</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white block font-medium">Saturday</span>
                  <span className="text-xs">9:00 AM – 4:00 PM (EAT)</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white block font-medium">Emergency Care</span>
                  <span className="text-xs text-rose-300">Same-Day Urgent Appointments Available</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4: Location & Direct Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Visit Viora Speciality Dental Center
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Bole Dembel Olompia Heights, 3rd Floor, Addis Ababa, Ethiopia
                </span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <a href="tel:+251911234567" className="hover:text-white transition-colors">
                  +251 946 807 777 / +251 946 817 777
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <a href="mailto:info@vioradental.com" className="hover:text-white transition-colors">
                  info@vioradental.com
                </a>
              </p>
            </div>
            <div className="mt-5">
              <Link
                to="/book"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold text-sky-950 bg-sky-400 hover:bg-sky-300 rounded-xl transition-colors"
              >
                Schedule an Appointment
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Viora Dental Center. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="hover:text-slate-300 transition-colors">
              Patient Inquiries
            </Link>
            <Link to="/blog" className="hover:text-slate-300 transition-colors">
              Oral Hygiene Advice
            </Link>
            {/* <Link to="/admin/login" className="text-slate-400 hover:text-sky-400 transition-colors">
              Staff & Admin Portal
            </Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
};
