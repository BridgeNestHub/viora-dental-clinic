import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  GraduationCap,
  Mail,
  Phone,
  CalendarCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { SEOHead } from '../../components/layout/SEOHead.js';
import { api, Doctor } from '../../api/index.js';

export const AboutPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getDentists()
      .then((data) => setDoctors(data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-12 lg:py-16">
      <SEOHead
        pageKey="about"
        fallbackTitle="Meet Our Dental Specialists & Clinic Story | Viora Dental"
        fallbackDescription="Learn about our lead dental surgeons, European-trained aesthetic doctors, state-of-the-art sterile protocols, and clinic philosophy."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Story & Philosophy Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16 pb-16 border-b border-slate-200">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-600">
              The Viora Story & Clinical Standards
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 font-display text-balance leading-tight">
              A New Standard in Modern, Anxiety-Free Dental Care.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Founded in Addis Ababa by Dr. Selamawit Bekele, Viora Dental Center was created to eliminate the anxiety and discomfort traditionally associated with dentistry. We combined European postgraduate aesthetic training with cutting-edge German digital scanning and computerized painless anesthesia.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              Our multidisciplinary team unites cosmetic dentists, specialist orthodontists, microscopic endodontists, and pediatric care physicians under a shared commitment to patient comfort, long-term oral health, and exquisite aesthetic harmony.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-3">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <div className="text-2xl font-bold text-sky-600 font-display">100%</div>
                <div className="text-xs text-slate-600 font-medium mt-1">Class-B Autoclave Sterility</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <div className="text-2xl font-bold text-slate-900 font-display">0.1 mm</div>
                <div className="text-xs text-slate-600 font-medium mt-1">Digital 3D Scan Accuracy</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 aspect-[4/3] bg-slate-900">
              <img
                src="/src/assets/images/viora_dental_operatory_1791308043951.jpg"
                alt="Viora Dental Center Operatory"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Doctor Profiles Section */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
              Our Specialist Clinicians
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-display">
              Meet the Doctors Behind Your Smile
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Board-certified practitioners combining international fellowships with gentle bedside manner.
            </p>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-slate-400">Loading specialist profiles...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6"
                >
                  {/* Photo & Badge */}
                  <div className="w-full sm:w-44 shrink-0 flex flex-col items-center">
                    <div className="w-36 h-36 rounded-2xl overflow-hidden bg-slate-100 shadow-inner relative">
                      <img
                        src={doc.photoUrl}
                        alt={doc.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="mt-3 text-[11px] font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                      {doc.experienceYears}+ Years Experience
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">{doc.name}</h3>
                      <div className="text-xs font-semibold text-sky-700 mt-0.5">{doc.title}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">{doc.specialization}</div>

                      <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <GraduationCap className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                        <span>{doc.qualifications}</span>
                      </div>

                      <p className="text-xs text-slate-600 mt-3 leading-relaxed">{doc.bio}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.workingHours?.start} - {doc.workingHours?.end}</span>
                      </div>

                      <Link
                        to={`/book?dentistId=${doc.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-sm"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Book Visit</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
