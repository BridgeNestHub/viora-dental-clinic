import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Calendar,
  Stethoscope,
  HelpCircle,
} from 'lucide-react';
import { SEOHead } from '../../components/layout/SEOHead.js';
import { api, Doctor, DentalService, AvailabilityData, Appointment } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.js';
import { addDaysToDateStr, getClinicToday } from '../../shared/clinicTime.js';

export const BookAppointmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { error, success } = useToast();

  const [step, setStep] = useState<number>(1);
  const [services, setServices] = useState<DentalService[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Selection states
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDentistId, setSelectedDentistId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Auto-assign doctor state for patients unfamiliar with dental specializations
  const [autoAssignDoctor, setAutoAssignDoctor] = useState<boolean>(true);

  // Availability data
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Patient info (FIRST NAME & LAST NAME SPLIT, EMAIL IS OPTIONAL)
  const [patientInfo, setPatientInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Payment method (cash, telebirr, cbe_birr, bank_transfer)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'telebirr' | 'cbe_birr' | 'bank_transfer'>('cash');

  // Booking result
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);

  // Initialize from searchParams or choose general consultation default
  useEffect(() => {
    Promise.all([api.getServices(), api.getDentists()]).then(([srvs, docs]) => {
      setServices(srvs);
      setDoctors(docs);

      const urlService = searchParams.get('serviceId');
      if (urlService && srvs.some((s) => s.id === urlService)) {
        setSelectedServiceId(urlService);
      } else if (srvs.length > 0) {
        // Default to General Examination for patients who know nothing about dentistry
        const generalSrv = srvs.find((s) => s.category === 'general') || srvs[0];
        setSelectedServiceId(generalSrv.id);
      }

      const urlDentist = searchParams.get('dentistId');
      if (urlDentist && docs.some((d) => d.id === urlDentist)) {
        setSelectedDentistId(urlDentist);
        setAutoAssignDoctor(false);
      } else if (docs.length > 0) {
        setSelectedDentistId(docs[0].id);
        setAutoAssignDoctor(true); // Default to auto-assign for patients unfamiliar with dentists
      }
    });

    // Default target date to today (clinic time)
    setSelectedDate(getClinicToday());
  }, [searchParams]);

  // Whenever dentist, date, or service changes, reload availability
  useEffect(() => {
    if (!selectedDentistId || !selectedDate) return;

    setIsLoadingSlots(true);
    const service = services.find((s) => s.id === selectedServiceId);
    const duration = service ? service.durationMinutes : 30;

    api
      .getAvailability(selectedDentistId, selectedDate, duration)
      .then((data) => {
        setAvailability(data);
        if (selectedSlot && !data.availableSlots.includes(selectedSlot)) {
          setSelectedSlot('');
        }
      })
      .catch(() => {
        setAvailability(null);
      })
      .finally(() => {
        setIsLoadingSlots(false);
      });
  }, [selectedDentistId, selectedDate, selectedServiceId]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedDentist = doctors.find((d) => d.id === selectedDentistId);

  // Standard phone check: Validates Ethiopian (+251 9..., 09..., +251 7..., 07...) or standard international (+...)
  const isStandardPhoneNumber = (phone: string): boolean => {
    if (!phone || !phone.trim()) return false;
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    const ethRegex = /^(?:\+?251|0)?[79]\d{8}$/;
    const intlRegex = /^\+[1-9]\d{7,14}$/;
    return ethRegex.test(cleaned) || intlRegex.test(cleaned);
  };

  const isPhoneValid = isStandardPhoneNumber(patientInfo.phone);

  // Stepper validation
  const handleNext = () => {
    if (step === 1) {
      if (!selectedServiceId) {
        // Auto pick general examination if nothing picked
        const generalSrv = services.find((s) => s.category === 'general') || services[0];
        if (generalSrv) {
          setSelectedServiceId(generalSrv.id);
        } else {
          error('Please choose a dental treatment.');
          return;
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedDentistId) {
        if (doctors.length > 0) {
          setSelectedDentistId(doctors[0].id);
          setAutoAssignDoctor(true);
        } else {
          error('Please choose a doctor or select the general practitioner option.');
          return;
        }
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedDate || !selectedSlot) {
        error('Please choose your preferred appointment date and an available time slot.');
        return;
      }
      setStep(4);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInfo.firstName.trim() || !patientInfo.lastName.trim()) {
      error('Please provide both Patient First Name and Last Name.');
      return;
    }

    if (!isPhoneValid) {
      error('Please enter a valid standard phone number (e.g. +251 911 234 567 or 0911234567). The phone field remains red until standard format is met.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.bookAppointment({
        patientName: `${patientInfo.firstName.trim()} ${patientInfo.lastName.trim()}`,
        patientFirstName: patientInfo.firstName.trim(),
        patientLastName: patientInfo.lastName.trim(),
        patientPhone: patientInfo.phone,
        patientEmail: patientInfo.email || undefined, // Email is optional!
        dentistId: selectedDentistId,
        serviceId: selectedServiceId,
        date: selectedDate,
        startTime: selectedSlot,
        paymentMethod,
        notes: autoAssignDoctor
          ? `[Patient selected General Practitioner / Auto-Assign | Payment: ${paymentMethod.toUpperCase()}] ${patientInfo.notes || ''}`.trim()
          : `[Payment: ${paymentMethod.toUpperCase()}] ${patientInfo.notes || ''}`.trim(),
        isWalkIn: false,
      });

      setBookedAppointment(created);
      setStep(5);
      success('Appointment successfully scheduled! Confirmation generated.');
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Could not complete booking. Please refresh available time slots.';
      error(msg);
      if (err.response?.status === 409) {
        setStep(3);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate date options for the next 14 days, starting from today in clinic time
  const dateOptions: { label: string; value: string; weekday: string }[] = [];
  const clinicToday = getClinicToday();
  for (let i = 0; i < 14; i++) {
    const value = addDaysToDateStr(clinicToday, i);
    // Format the calendar date itself (UTC) so labels always match the value
    const d = new Date(`${value}T00:00:00Z`);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    dateOptions.push({ value, weekday, label });
  }

  // Identify default general service
  const generalDefaultService = services.find((s) => s.category === 'general') || services[0];

  return (
    <div className="bg-slate-50 min-h-screen py-10 lg:py-14">
      <SEOHead
        pageKey="booking"
        fallbackTitle="Book an Appointment Online | Viora Dental Center"
        fallbackDescription="Schedule your dental visit in real-time. Select your preferred doctor, treatment, and time slot with instant confirmation."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
            Real-Time Clinical Scheduling
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-display">
            Book Your Dental Visit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live doctor availability with guaranteed zero double-booking.
          </p>
        </div>

        {/* Stepper Indicator (Hide on step 5) */}
        {step < 5 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm mb-8">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span className={step >= 1 ? 'text-sky-600 font-bold' : ''}>1. Service</span>
              <span className="text-slate-300">→</span>
              <span className={step >= 2 ? 'text-sky-600 font-bold' : ''}>2. Doctor</span>
              <span className="text-slate-300">→</span>
              <span className={step >= 3 ? 'text-sky-600 font-bold' : ''}>3. Date & Time</span>
              <span className="text-slate-300">→</span>
              <span className={step >= 4 ? 'text-sky-600 font-bold' : ''}>4. Your Details</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-sky-600 h-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* ================= STEP 1: SELECT SERVICE ================= */}
        {step === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Step 1: Select Dental Treatment</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose a treatment below, or choose our default consultation if you're not sure what you need.
                </p>
              </div>

              {/* Quick skip button for patients unfamiliar with dentistry */}
              <button
                type="button"
                onClick={() => {
                  if (generalDefaultService) {
                    setSelectedServiceId(generalDefaultService.id);
                  }
                  setStep(2);
                }}
                className="text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-1"
              >
                <span>Skip to Doctor (Keep General Checkup) →</span>
              </button>
            </div>

            {/* DEFAULT / UNSURE OPTION FOR PATIENTS WHO KNOW NOTHING ABOUT DENTISTRY */}
            {generalDefaultService && (
              <div
                onClick={() => setSelectedServiceId(generalDefaultService.id)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  selectedServiceId === generalDefaultService.id
                    ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-sky-300 bg-white hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        General Dental Examination & Consultation (Default / Not Sure)
                      </h3>
                      <span className="text-[10px] bg-sky-600 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Recommended If Unsure
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Don’t know about dental procedures or experiencing toothache, bleeding, or sensitivity? Pick this option. Our dentist will conduct a complete oral examination, identify the problem, and guide you through the ideal treatment.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <div className="text-right mr-2 hidden sm:block">
                    <div className="text-xs font-bold text-slate-900">ETB {generalDefaultService.startingPrice.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">{generalDefaultService.durationMinutes} mins</div>
                  </div>
                  <span className="text-xs font-semibold text-sky-700">
                    {selectedServiceId === generalDefaultService.id ? 'Selected' : 'Select'}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedServiceId === generalDefaultService.id
                        ? 'border-sky-600 bg-sky-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedServiceId === generalDefaultService.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Or Choose a Specific Dental Procedure
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services
                .filter((s) => s.id !== generalDefaultService?.id)
                .map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedServiceId === s.id
                        ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug">{s.name}</h3>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                          selectedServiceId === s.id
                            ? 'border-sky-600 bg-sky-600'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedServiceId === s.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                      <span className="tabular-nums font-semibold text-slate-800">
                        ETB {s.startingPrice.toLocaleString()}
                      </span>
                      <span>{s.durationMinutes} mins</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (generalDefaultService) setSelectedServiceId(generalDefaultService.id);
                  setStep(2);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-sky-700 transition-colors"
              >
                Skip / Not sure what I need →
              </button>

              <button
                onClick={handleNext}
                className="px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <span>Continue to Doctor Selection</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SELECT DENTIST ================= */}
        {step === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Step 2: Choose Your Dental Doctor</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your preferred clinician, or let our clinic director assign the ideal practitioner for your procedure.
                </p>
              </div>

              {/* Quick skip button for doctor selection */}
              <button
                type="button"
                onClick={() => {
                  setAutoAssignDoctor(true);
                  if (doctors.length > 0) {
                    setSelectedDentistId(doctors[0].id);
                  }
                  setStep(3);
                }}
                className="text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-1"
              >
                <span>Skip Doctor (First Available) →</span>
              </button>
            </div>

            {/* DEFAULT / AUTO-ASSIGN OPTION FOR PATIENTS WHO DON'T KNOW DENTISTS */}
            <div
              onClick={() => {
                setAutoAssignDoctor(true);
                if (doctors.length > 0) {
                  setSelectedDentistId(doctors[0].id);
                }
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                autoAssignDoctor
                  ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/25 shadow-sm'
                  : 'border-slate-200 hover:border-sky-300 bg-white hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      First Available Specialist / General Practitioner (Default)
                    </h3>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Recommended If You Don't Know Our Dentists
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Don’t know which dentist to pick or unfamiliar with dental specialties? We will automatically match you with our lead general dentist or the certified specialist best suited for your treatment time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span className="text-xs font-semibold text-sky-700">
                  {autoAssignDoctor ? 'Selected' : 'Select'}
                </span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    autoAssignDoctor
                      ? 'border-sky-600 bg-sky-600'
                      : 'border-slate-300'
                  }`}
                >
                  {autoAssignDoctor && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Or Choose a Specific Specialist Doctor
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((doc) => {
                const isSelected = !autoAssignDoctor && selectedDentistId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setAutoAssignDoctor(false);
                      setSelectedDentistId(doc.id);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={doc.photoUrl}
                      alt={doc.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{doc.name}</h3>
                      <p className="text-xs text-sky-700 font-medium truncate">{doc.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{doc.specialization}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-sky-600 bg-sky-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* Skip button for patients who don't know who to pick */}
                <button
                  type="button"
                  onClick={() => {
                    setAutoAssignDoctor(true);
                    if (doctors.length > 0) {
                      setSelectedDentistId(doctors[0].id);
                    }
                    setStep(3);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-sky-700 transition-colors"
                >
                  Skip Doctor Selection →
                </button>

                <button
                  onClick={handleNext}
                  className="px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Continue to Date & Time</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: DATE & REAL-TIME SLOTS ================= */}
        {step === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Step 3: Select Date & Available Time Slot</h2>
              <p className="text-xs text-slate-500 mt-1">
                {autoAssignDoctor
                  ? 'Showing live schedule for First Available General Practitioner / Lead Doctor'
                  : `Showing live calendar for ${selectedDentist?.name || 'Selected Doctor'}`}
              </p>
            </div>

            {/* 14-Day Date Scroller */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                1. Select Preferred Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(opt.value);
                      setSelectedSlot('');
                    }}
                    className={`flex flex-col items-center justify-center min-w-[70px] py-3 px-2 rounded-2xl border text-xs transition-all ${
                      selectedDate === opt.value
                        ? 'border-sky-600 bg-sky-600 text-white font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold opacity-80">{opt.weekday}</span>
                    <span className="text-sm font-bold mt-0.5">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Time Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  2. Choose 30-Minute Slot
                </label>
                {selectedSlot && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Selected: {selectedSlot}
                  </span>
                )}
              </div>

              {isLoadingSlots ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Checking real-time doctor availability...</span>
                </div>
              ) : !availability ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  Please select a valid date to load live time slots.
                </div>
              ) : !availability.isWorkingDay ? (
                <div className="p-6 text-center text-xs text-rose-700 bg-rose-50 rounded-2xl border border-rose-200">
                  {selectedDentist?.name || 'This doctor'} does not see patients on this date. Please select another date above.
                </div>
              ) : availability.availableSlots.length === 0 ? (
                <div className="p-6 text-center text-xs text-rose-700 bg-rose-50 rounded-2xl border border-rose-200">
                  No open slots remain on this date. Please select an alternate date above.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availability.availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2.5 text-xs font-bold rounded-xl border tabular-nums transition-all ${
                        selectedSlot === slot
                          ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50/50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedSlot}
                className={`px-6 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                  selectedSlot
                    ? 'text-white bg-sky-600 hover:bg-sky-700 shadow-sm cursor-pointer'
                    : 'text-slate-400 bg-slate-100 cursor-not-allowed'
                }`}
              >
                <span>Continue to Patient Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: PATIENT INFO (PHONE RED UNTIL CORRECT STANDARD FORMAT) ================= */}
        {step === 4 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900 font-display">Step 4: Patient Information</h2>

            {/* Booking Summary Pill */}
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Treatment:</span>
                <span className="font-bold text-slate-900">{selectedService?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Doctor:</span>
                <span className="font-bold text-slate-900">
                  {autoAssignDoctor ? 'First Available General Practitioner' : selectedDentist?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Appointment Slot:</span>
                <span className="font-bold text-sky-700 tabular-nums">
                  {selectedDate} at {selectedSlot}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Starting Fee:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  ETB {selectedService?.startingPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Patient First Name and Last Name Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Patient First Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Almaz"
                      value={patientInfo.firstName}
                      onChange={(e) => setPatientInfo({ ...patientInfo, firstName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Patient Last Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kebede"
                      value={patientInfo.lastName}
                      onChange={(e) => setPatientInfo({ ...patientInfo, lastName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* PHONE NUMBER FIELD: RED UNTIL STANDARD FORMAT IS ENTERED */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone Number (SMS / WhatsApp) *
                  </label>

                  {/* Dynamic validation badge */}
                  {isPhoneValid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Standard Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      Standard Format Required
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Phone
                    className={`w-4 h-4 absolute left-3.5 top-3 transition-colors ${
                      isPhoneValid ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="+251 9XX XXX XXX or 09XXXXXXXX"
                    value={patientInfo.phone}
                    onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                    className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border-2 transition-all ${
                      isPhoneValid
                        ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600'
                        : 'border-rose-500 bg-rose-50/40 text-rose-950 placeholder:text-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-600'
                    }`}
                  />
                  {isPhoneValid && (
                    <div className="absolute right-3.5 top-3 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Red helper message until correct phone number is entered */}
                {!isPhoneValid ? (
                  <div className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-600 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      Please enter standard phone: <span className="font-mono font-bold">+251 9XX XXX XXX</span>, <span className="font-mono font-bold">09XXXXXXXX</span>, or int'l <span className="font-mono font-bold">+...</span> (box turns green when valid).
                    </span>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Standard phone number accepted. Confirmation SMS will be sent here.</span>
                  </div>
                )}

                {/* Quick-format helper shortcuts */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Format presets:</span>
                  <button
                    type="button"
                    onClick={() => setPatientInfo({ ...patientInfo, phone: '+251 9' })}
                    className="text-[10px] font-mono font-semibold text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    +251 9...
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientInfo({ ...patientInfo, phone: '09' })}
                    className="text-[10px] font-mono font-semibold text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    09...
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientInfo({ ...patientInfo, phone: '+251 7' })}
                    className="text-[10px] font-mono font-semibold text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    +251 7...
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional — confirmation receipt)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="patient@example.com (optional)"
                    value={patientInfo.email}
                    onChange={(e) => setPatientInfo({ ...patientInfo, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* PAYMENT METHOD SELECTION (CASH, TELEBIRR, CBE BIRR, BANK TRANSFER) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Payment Method *
                  </label>
                  <span className="text-[11px] text-sky-700 font-semibold">
                    Flexible Payment Options
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'cash',
                      title: 'Cash at Reception',
                      desc: 'Pay at clinic front desk during your clinical visit',
                      badge: 'Pay on Arrival',
                      iconText: '💵',
                    },
                    {
                      id: 'telebirr',
                      title: 'Telebirr',
                      desc: 'Instant mobile payment via Ethio Telecom SuperApp',
                      badge: 'Instant QR / Mobile',
                      iconText: '📱',
                    },
                    {
                      id: 'cbe_birr',
                      title: 'CBE Birr',
                      desc: 'Direct payment from Commercial Bank of Ethiopia wallet',
                      badge: 'CBE Mobile Wallet',
                      iconText: '🏦',
                    },
                    {
                      id: 'bank_transfer',
                      title: 'Bank Transfer',
                      desc: 'Direct wire deposit to Viora Clinic CBE / Awash Account',
                      badge: 'Bank Account Transfer',
                      iconText: '💳',
                    },
                  ].map((pm) => (
                    <div
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        paymentMethod === pm.id
                          ? 'border-sky-600 bg-sky-50/70 shadow-xs ring-2 ring-sky-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{pm.iconText}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentMethod === pm.id ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                          }`}
                        >
                          {paymentMethod === pm.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div className="mt-2.5">
                        <h4 className="font-bold text-xs text-slate-900">{pm.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{pm.desc}</p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="font-medium text-slate-600">{pm.badge}</span>
                        {paymentMethod === pm.id && (
                          <span className="font-bold text-sky-700">✓ Selected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes / Symptoms / Requests <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Sensitivity to cold water, previous root canal history, interested in cosmetic whitening..."
                  value={patientInfo.notes}
                  onChange={(e) => setPatientInfo({ ...patientInfo, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isPhoneValid}
                  className={`px-8 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 ${
                    isPhoneValid && !isSubmitting
                      ? 'text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 cursor-pointer'
                      : 'text-slate-400 bg-slate-200 cursor-not-allowed shadow-none'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Confirming Slot...' : 'Confirm Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 5: CONFIRMATION RECEIPT ================= */}
        {step === 5 && bookedAppointment && (
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Booking Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mt-3">
                We Look Forward to Seeing You!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your appointment has been registered in Viora Dental Center's clinical schedule.
              </p>
            </div>

            {/* Official Appointment Card */}
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Booking Reference
                </span>
                <span className="text-sm font-mono font-bold text-sky-700">
                  {bookedAppointment.appointmentNumber}
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-semibold text-slate-800">
                    {bookedAppointment.patientName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800">{bookedAppointment.patientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-semibold text-slate-800">{bookedAppointment.dentistName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Treatment:</span>
                  <span className="font-semibold text-slate-800">{bookedAppointment.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Date:</span>
                  <span className="font-semibold text-slate-800">{bookedAppointment.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Slot:</span>
                  <span className="font-bold text-sky-700">
                    {bookedAppointment.startTime} – {bookedAppointment.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Option:</span>
                  <span className="font-bold text-emerald-700">
                    {bookedAppointment.paymentMethod === 'telebirr'
                      ? '📱 Telebirr (Instant Mobile Pay)'
                      : bookedAppointment.paymentMethod === 'cbe_birr'
                      ? '🏦 CBE Birr (Mobile Wallet)'
                      : bookedAppointment.paymentMethod === 'bank_transfer'
                      ? '💳 Bank Account Transfer'
                      : '💵 Cash at Clinic Reception'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Clinic Location:</span>
                  <span className="font-medium text-slate-800 text-right">
                    Medhanialem Mall 4th Fl, Bole, Addis Ababa
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Confirmation</span>
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
