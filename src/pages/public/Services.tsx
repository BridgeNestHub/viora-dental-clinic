import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Stethoscope,
  Smile,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import { SEOHead } from '../../components/layout/SEOHead.js';
import { api, DentalService } from '../../api/index.js';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<DentalService[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getServices()
      .then((data) => setServices(data))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'general', label: 'General & Preventative' },
    { id: 'cosmetic', label: 'Cosmetic & Veneers' },
    { id: 'orthodontics', label: 'Clear Aligners' },
    { id: 'implants', label: 'Dental Implants' },
    { id: 'whitening', label: 'Teeth Whitening' },
    { id: 'root_canal', label: 'Endodontics' },
    { id: 'pediatric', label: 'Pediatric Care' },
    { id: 'emergency', label: 'Urgent Care' },
  ];

  const filtered =
    activeCategory === 'all'
      ? services
      : services.filter((s) => s.category === activeCategory);

  return (
    <div className="bg-slate-50 min-h-screen py-12 lg:py-16">
      <SEOHead
        pageKey="services"
        fallbackTitle="Clinical Dental Services | Viora Dental Center"
        fallbackDescription="Explore our comprehensive range of specialized dental treatments: general exams, implants, cosmetic veneers, orthodontics, and emergency relief."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
            Clinical Procedures & Fee Guide
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 font-display text-balance">
            Evidence-Based Dentistry Delivered With Gentle Precision.
          </h1>
          <p className="text-base text-slate-600 mt-4 leading-relaxed">
            Every procedure at Viora Dental Center is performed under strict sterile protocols with German-engineered optics, digital intraoral modeling, and transparent pricing in Ethiopian Birr (ETB).
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services List */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Loading dental treatments...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      {s.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 leading-snug">{s.name}</h3>

                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    {s.description}
                  </p>

                  <div className="mt-5 space-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-500" />
                      <span>Duration: Approx {s.durationMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Digital 3D pre-treatment scan included</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block uppercase tracking-wider">
                      Starting Price
                    </span>
                    <span className="text-base font-bold text-slate-900 tabular-nums">
                      ETB {s.startingPrice.toLocaleString()}
                    </span>
                  </div>

                  <Link
                    to={`/book?serviceId=${s.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Book Service</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
