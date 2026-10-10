import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Sparkles,
  ShieldCheck,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  HeartHandshake,
  Stethoscope,
  Smile,
  ArrowRight,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { SEOHead } from '../../components/layout/SEOHead.js';
import { BeforeAfterSlider } from '../../components/ui/BeforeAfterSlider.js';
import { api, Doctor, DentalService, GalleryItem, Testimonial } from '../../api/index.js';

// 3 Showcase Images for Right Column Hero Swipe
const heroShowcaseSlides = [
  {
    id: 1,
    image: '/src/assets/images/viora_clinic_reception_1791308031194.jpg',
    tag: 'Bole Medhanialem Clinic · 4th Floor',
    title: 'Executive Reception & Patient Lounge',
    description: 'Scandinavian light oak and ambient acoustics designed to eliminate clinic stress before care.',
  },
  {
    id: 2,
    image: '/src/assets/images/viora_dental_operatory_1791308043951.jpg',
    tag: 'Hospital-Grade Sterilization Protocol',
    title: 'High-Tech Digital Operatory Suites',
    description: 'European Class-B autoclaves, noise-canceling audio & computerized painless dental anesthesia.',
  },
  {
    id: 3,
    image: '/src/assets/images/viora_smile_consultation_1791308064299.jpg',
    tag: 'Personalized 3D Aesthetic Planning',
    title: 'Cosmetic Consultation & Digital Smile Design',
    description: 'Preview high-definition digital porcelain veneers and clear aligner simulations before clinical bonding.',
  },
];

const HeroShowcaseCarousel: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-advance every 5 seconds if not hovered or dragging
  useEffect(() => {
    if (isPaused || isDragging) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % heroShowcaseSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, isDragging]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + heroShowcaseSlides.length) % heroShowcaseSlides.length);
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % heroShowcaseSlides.length);
  };

  // Drag / Swipe handlers for Touch & Mouse
  const startDrag = (clientX: number) => {
    setDragStartX(clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const moveDrag = (clientX: number) => {
    if (dragStartX === null || !isDragging) return;
    const diff = clientX - dragStartX;
    setDragOffset(diff);
  };

  const endDrag = () => {
    if (!isDragging) return;
    if (Math.abs(dragOffset) > 40) {
      if (dragOffset < 0) {
        handleNext(); // swiped left -> next
      } else {
        handlePrev(); // swiped right -> prev
      }
    }
    setDragStartX(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  const activeSlide = heroShowcaseSlides[currentIdx];

  return (
    <div className="space-y-2.5">
      {/* Visual Showcase Card with Horizontal Sliding Track */}
      <div
        className={`relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 aspect-[4/3] bg-slate-900 group select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          if (isDragging) endDrag();
        }}
        onTouchStart={(e) => startDrag(e.touches[0].clientX)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
        onTouchEnd={endDrag}
        onMouseDown={(e) => startDrag(e.clientX)}
        onMouseMove={(e) => moveDrag(e.clientX)}
        onMouseUp={endDrag}
      >
        {/* Horizontal Sliding Track with all 3 Images */}
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(calc(-${currentIdx * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {heroShowcaseSlides.map((slide) => (
            <div key={slide.id} className="w-full h-full shrink-0 relative">
              <img
                src={slide.image}
                alt={slide.title}
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-black/20 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Top Header Badge & Slide Counter */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
          <div className="inline-flex items-center gap-2 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full border border-white/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{activeSlide.tag}</span>
          </div>

          <div className="bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/10 tabular-nums">
            {currentIdx + 1} / 3
          </div>
        </div>

        {/* Bottom Slide Info & Controls */}
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-5 z-20 pointer-events-none">
          <h3 className="text-base sm:text-lg font-bold text-white font-display leading-snug drop-shadow-sm">
            {activeSlide.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed line-clamp-2 max-w-md">
            {activeSlide.description}
          </p>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/15 pointer-events-auto">
            {/* 3 Clickable Dots / Bars */}
            <div className="flex items-center gap-1.5">
              {heroShowcaseSlides.map((slide, dotIdx) => (
                <button
                  key={slide.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIdx(dotIdx);
                  }}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    dotIdx === currentIdx
                      ? 'w-7 bg-sky-400'
                      : 'w-2 bg-white/40 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>

            <span className="text-[10px] text-slate-300 font-medium tracking-wide flex items-center gap-1">
              {/* <span>Drag / swipe between 3 suites</span> */}
            </span>
          </div>
        </div>

        {/* Left/Right Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous clinic image"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 backdrop-blur-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg cursor-pointer hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next clinic image"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 backdrop-blur-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg cursor-pointer hover:scale-105"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 3 Quick Switcher Tabs directly below */}
      {/* <div className="grid grid-cols-3 gap-2">
        {heroShowcaseSlides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrentIdx(idx)}
            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-all border text-center truncate cursor-pointer ${
              idx === currentIdx
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span className="truncate">{idx + 1}. {slide.title.split(' ')[0]} {slide.title.split(' ')[1] || ''}</span>
          </button>
        ))}
      </div> */}
    </div>
  );
};

export const Home: React.FC = () => {
  const [services, setServices] = useState<DentalService[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    api.getServices().then((res) => setServices(res.slice(0, 6)));
    api.getDentists().then((res) => setDoctors(res.slice(0, 4)));
    api.getGallery().then((res) => setGallery(res.filter((g) => g.isBeforeAfter).slice(0, 2)));
    api.getTestimonials().then((res) => setTestimonials(res.slice(0, 3)));
  }, []);

  const faqs = [
    {
      q: 'Is dental treatment really painless at Viora Dental Center?',
      a: 'Yes. We utilize computerized local anesthesia delivery systems, ultra-fine microscopic needles, and pre-numbing topical gels that virtually eliminate needle sensation. For anxious patients, we also provide calming sensory environments with ceiling noise-canceling headphones.',
    },
    {
      q: 'How does real-time appointment scheduling work?',
      a: 'Our booking system dynamically checks our dental specialists’ live calendars. Once you choose your preferred treatment, doctor, date, and 30-minute time slot, the slot is locked instantly to guarantee zero double-booking.',
    },
    {
      q: 'Do you offer same-day emergency dental appointments?',
      a: 'Yes! If you are experiencing sudden severe tooth pain, trauma, or a broken crown, we reserve daily emergency slots. You can book directly online or call our front desk at +251 911 234 567.',
    },
    {
      q: 'How long do porcelain veneers and clear aligners take?',
      a: 'Porcelain veneers usually require 2 clinical visits spaced 5 to 7 days apart (initial 3D digital preparation and temporary mockup, followed by permanent bonding). Clear aligner therapy typically ranges between 4 to 12 months depending on bite complexity.',
    },
  ];

  return (
    <div className="bg-slate-50">
      <SEOHead
        pageKey="home"
        fallbackTitle="Viora Dental Center - Premier Dental Care & Aesthetic Dentistry"
        fallbackDescription="Experience world-class painless dentistry in Addis Ababa. Digital smile design, porcelain veneers, dental implants, clear aligners, and comprehensive family care."
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 bg-sky-100/80 px-3 py-1.5 rounded-lg border border-sky-200/60">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Premier Aesthetic & Painless Dentistry in Addis Ababa</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 font-display leading-[1.1] text-balance">
                Precision Dental Care for Your Most Confident Smile.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Experience gentle, digital dental treatments guided by highly trained aesthetic doctors and maxillofacial specialists. From routine hygiene to full-mouth porcelain smile makeovers, we make every visit serene.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl transition-all shadow-md hover:shadow-sky-500/25"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Book an Appointment</span>
                </Link>

                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                >
                  <span>Explore All Services</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-2xl font-bold text-slate-900 font-display tabular-nums">5+</div>
                  <div className="text-xs text-slate-500 mt-0.5">Years of Clinical Excellence</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 font-display tabular-nums">3,200+</div>
                  <div className="text-xs text-slate-500 mt-0.5">Smiles Transformed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-sky-600 font-display tabular-nums">100%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Satisfied Customers</div>
                  {/* <div className="text-xs text-slate-500 mt-0.5">Sterile Class B Autoclave</div> */}
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase (3 Swipable Images) */}
            <div className="lg:col-span-5 relative">
              <HeroShowcaseCarousel />

              {/* Floating Quick Card */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3.5 max-w-xs z-20">
                <div className="w-11 h-6 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Creating Smiles for Life</div>
                  {/* <div className="text-xs font-bold text-slate-900">Zero Double-Booking Guarantee</div> */}
                  {/* <div className="text-[11px] text-slate-500 mt-0.5">Instant online calendar synchronization</div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="py-20 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
                Specialized Treatments
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-display text-balance">
                Comprehensive Dental Care Under One Roof
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors shrink-0"
            >
              <span>View all treatments & fees</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.id}
                className="group p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-100/70 text-sky-700 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    {s.isPopular && (
                      <span className="text-[11px] font-semibold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md">
                        Popular Treatment
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Starting from</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      ETB {s.startingPrice.toLocaleString()}
                    </span>
                  </div>
                  <Link
                    to={`/book?serviceId=${s.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                  >
                    <span>Book ({s.durationMinutes}m)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Viora Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
              Why Patients Trust Viora
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-display text-balance">
              Where Technology Meets Gentle Human Compassion
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">3D Digital Precision</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Intraoral 3D color scanners replace uncomfortable putty impressions, providing sub-millimeter precision for crowns, veneers, and aligners.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Painless Anesthesia</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Computer-regulated delivery gently numbs targeted teeth before you feel pressure, ensuring stress-free dental visits even for phobic patients.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Hospital-Grade Sterilization</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                European Class-B vacuum autoclaves and individualized pouch tracking ensure complete sterilization and microbiological safety.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Zero Wait Policy</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We respect your busy schedule. Confirmed appointments start promptly with dedicated doctor focus and transparent pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Before & After Interactive Showcase */}
      {gallery.length > 0 && (
        <section className="py-20 bg-white border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
                  Clinical Evidence
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-display text-balance">
                  Real Transformations, Authentic Results
                </h2>
                <p className="text-sm text-slate-600 mt-2 max-w-xl">
                  Slide left and right on our clinical case records to see immediate aesthetic changes.
                </p>
              </div>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors shrink-0"
              >
                <span>View Full Smile Gallery</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {gallery.map((item) => (
                <div key={item.id} className="space-y-3">
                  <BeforeAfterSlider
                    beforeImage={item.beforeImageUrl || ''}
                    afterImage={item.afterImageUrl || ''}
                    title={item.title}
                    doctorName={item.doctorName}
                  />
                  <p className="text-xs sm:text-sm text-slate-600 px-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Doctor Highlights Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
                Our Clinicians
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-display text-balance">
                Led by Accredited Specialists & Surgeons
              </h2>
            </div>
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors shrink-0"
            >
              <span>Learn more about our dental team</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                  <img
                    src={doc.photoUrl}
                    alt={doc.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                    {doc.experienceYears}+ Yrs Exp
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{doc.name}</h3>
                    <p className="text-xs font-medium text-sky-700 mt-0.5">{doc.title}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{doc.bio}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 capitalize">
                      {doc.workingDays.length} days/week
                    </span>
                    <Link
                      to={`/book?dentistId=${doc.id}`}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
                    >
                      Book Visit →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
              Patient Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-display text-balance">
              What Our Patients Say About Their Experience
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: Math.min(5, Math.max(0, Math.round(Number(t.rating) || 0))) }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    "{t.comment}"
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200/60">
                  <div className="text-sm font-bold text-slate-900">{t.patientName}</div>
                  <div className="text-xs text-sky-700">{t.treatment}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ & Map/Hours Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* FAQ */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display mb-6">
                Clear Answers to Common Questions
              </h2>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-slate-900 hover:text-sky-700 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>{faq.q}</span>
                      </span>
                      <span className="text-slate-400 text-lg leading-none shrink-0">
                        {openFaq === idx ? '−' : '+'}
                      </span>
                    </button>
                    {openFaq === idx && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Clinic Hours & Location Card */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  Viora Speciality Dental Center
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Modern dental practice in the heart of Bole
                </p>
              </div>

              {/* Working Hours */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Monday – Friday</span>
                  <span className="font-semibold text-slate-900 tabular-nums">8:30 AM – 6:30 PM</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Saturday</span>
                  <span className="font-semibold text-slate-900 tabular-nums">9:00 AM – 4:00 PM</span>
                </div>
                <div className="flex items-center justify-between py-2 text-rose-600">
                  <span>Sunday</span>
                  <span className="font-semibold">Closed (Urgent on-call)</span>
                </div>
              </div>

              {/* Physical Location */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-600">
                  <MapPin className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    Bole Dembel Olompia Heights Building 3rd Floor, Addis Ababa, Ethiopia
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600">
                  <Phone className="w-5 h-5 text-sky-600 shrink-0" />
                  <span>+251 946 807 777 / +251 946 817 777</span>
                </div>
              </div>

              {/* Map Preview Container */}
              {/* <div className="w-full h-44 rounded-2xl bg-sky-50 border border-sky-100 relative overflow-hidden flex flex-col items-center justify-center text-center p-4">
                  
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900">Bole Medhanialem Central Location</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Ample secure underground parking & elevator access</div>
                <a
                  href="https://maps.google.com/?q=Bole+Medhanialem+Addis+Ababa"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-800 underline"
                >
                  Open in Google Maps →
                </a>
                  
              </div> */}
              
                <div className="w-full h-44 rounded-2xl bg-sky-50 border border-sky-100 relative overflow-hidden flex flex-col items-center justify-center text-center p-4">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1970.3207432945449!2d38.76737945661524!3d9.00509794690548!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b85585d0babc9%3A0x8dac4debf7649d07!2sVIORA%20SPECIALITY%20DENTAL%20CENTRE!5e0!3m2!1sen!2set!4v1791383618435!5m2!1sen!2set"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="absolute inset-0 w-full h-full"
                  />
                </div>

              <Link
                to="/book"
                className="block w-full py-3 text-center text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm"
              >
                Schedule Your Consultation Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
