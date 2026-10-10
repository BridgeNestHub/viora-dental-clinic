import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  Filter,
  PlusCircle,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  X,
  User,
} from 'lucide-react';
import { api, Appointment, Doctor, DentalService, AvailabilityData } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getClinicToday } from '../../shared/clinicTime.js';

export const AppointmentsManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<DentalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dentistFilter, setDentistFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);

  // Walk-in form state (Split first/last name, payment method, optional email)
  const [walkInForm, setWalkInForm] = useState({
    patientFirstName: '',
    patientLastName: '',
    patientPhone: '',
    patientEmail: '', // Optional!
    paymentMethod: 'cash' as 'cash' | 'telebirr' | 'cbe_birr' | 'bank_transfer',
    dentistId: '',
    serviceId: '',
    date: getClinicToday(),
    startTime: '',
    notes: 'Walk-in patient registered by front desk.',
  });
  const [walkInAvailability, setWalkInAvailability] = useState<AvailabilityData | null>(null);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  // Reschedule form state
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Filters are passed explicitly so callers that just reset state don't query with stale values
  const loadData = (
    filters = { search: searchQuery, status: statusFilter, dentistId: dentistFilter, date: dateFilter }
  ) => {
    setIsLoading(true);
    Promise.all([
      api.getAppointments({
        search: filters.search || undefined,
        status: filters.status || undefined,
        dentistId: filters.dentistId || undefined,
        date: filters.date || undefined,
      }),
      api.getDentists(true),
      api.getServices(),
    ])
      .then(([apts, docs, srvs]) => {
        setAppointments(apts);
        setDoctors(docs);
        setServices(srvs);
        if (docs.length > 0 && !walkInForm.dentistId) {
          setWalkInForm((prev) => ({ ...prev, dentistId: docs[0].id }));
        }
        if (srvs.length > 0 && !walkInForm.serviceId) {
          setWalkInForm((prev) => ({ ...prev, serviceId: srvs[0].id }));
        }
      })
      .catch((err: any) => {
        error(err.response?.data?.error?.message || 'Could not load appointments.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('action') === 'walkin') {
      setWalkInModalOpen(true);
    }
  }, [searchParams, statusFilter, dentistFilter, dateFilter]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const isDoctor = user?.role === 'doctor';

  // Status updates
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      success(`Appointment status updated to '${newStatus}'.`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus as any } : a))
      );
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update status.');
    }
  };

  // Walk-in availability watcher (slot fit depends on the selected treatment's duration)
  useEffect(() => {
    if (walkInForm.dentistId && walkInForm.date) {
      const duration = services.find((s) => s.id === walkInForm.serviceId)?.durationMinutes;
      api
        .getAvailability(walkInForm.dentistId, walkInForm.date, duration)
        .then((data) => {
          setWalkInAvailability(data);
          // Keep the chosen time only if it is still offered; otherwise pick the first open slot
          setWalkInForm((prev) => ({
            ...prev,
            startTime: data.availableSlots.includes(prev.startTime) ? prev.startTime : data.availableSlots[0] || '',
          }));
        })
        .catch(() => {
          setWalkInAvailability(null);
          setWalkInForm((prev) => ({ ...prev, startTime: '' }));
        });
    }
  }, [walkInForm.dentistId, walkInForm.date, walkInForm.serviceId, services]);

  // Reschedule availability watcher (ignores the appointment's own current slot)
  useEffect(() => {
    if (reschedulingApt && rescheduleDate) {
      const duration = services.find((s) => s.id === reschedulingApt.serviceId)?.durationMinutes;
      api
        .getAvailability(reschedulingApt.dentistId, rescheduleDate, duration, reschedulingApt.id)
        .then((data) => {
          setRescheduleSlots(data.availableSlots);
          setRescheduleTime((prev) =>
            data.availableSlots.includes(prev) ? prev : data.availableSlots[0] || ''
          );
        })
        .catch(() => {
          setRescheduleSlots([]);
          setRescheduleTime('');
        });
    }
  }, [reschedulingApt, rescheduleDate, services]);

  // Submit walk-in
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.patientFirstName.trim() || !walkInForm.patientLastName.trim() || !walkInForm.patientPhone || !walkInForm.startTime) {
      error('Please fill in patient first name, last name, phone number, and time slot.');
      return;
    }

    const resolvedPatientName = `${walkInForm.patientFirstName.trim()} ${walkInForm.patientLastName.trim()}`;

    setIsSubmittingWalkIn(true);
    try {
      const created = await api.bookAppointment({
        ...walkInForm,
        patientName: resolvedPatientName,
        patientFirstName: walkInForm.patientFirstName.trim(),
        patientLastName: walkInForm.patientLastName.trim(),
        patientEmail: walkInForm.patientEmail || undefined, // Optional email!
        paymentMethod: walkInForm.paymentMethod,
        isWalkIn: true,
      });

      success(`Walk-in patient booked: ${created.appointmentNumber}`);
      setWalkInModalOpen(false);
      setWalkInForm({
        patientFirstName: '',
        patientLastName: '',
        patientPhone: '',
        patientEmail: '',
        paymentMethod: 'cash',
        dentistId: doctors[0]?.id || '',
        serviceId: services[0]?.id || '',
        date: getClinicToday(),
        startTime: '',
        notes: 'Walk-in patient registered by front desk.',
      });
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Could not register walk-in patient.');
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  // Submit reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingApt || !rescheduleDate || !rescheduleTime) {
      error('Please select both date and time slot.');
      return;
    }

    setIsRescheduling(true);
    try {
      await api.rescheduleAppointment(reschedulingApt.id, rescheduleDate, rescheduleTime);
      success(`Appointment ${reschedulingApt.appointmentNumber} rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
      setRescheduleModalOpen(false);
      setReschedulingApt(null);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Could not reschedule appointment.');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Appointment Management
          </h2>
          <p className="text-xs text-slate-500">
            View, confirm, reschedule, or register clinic appointments with collision prevention.
          </p>
        </div>

        <button
          onClick={() => setWalkInModalOpen(true)}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Walk-In Patient</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by patient name, phone, or VIO- reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={dentistFilter}
              onChange={(e) => setDentistFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
            />

            {(searchQuery || statusFilter || dentistFilter || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setDentistFilter('');
                  setDateFilter('');
                  loadData({ search: '', status: '', dentistId: '', date: '' });
                }}
                className="px-3 py-2 text-xs text-rose-600 hover:text-rose-800 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Appointments Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No matching appointments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Ref & Patient</th>
                  <th className="py-3.5 px-4">Treatment</th>
                  <th className="py-3.5 px-4">Doctor</th>
                  <th className="py-3.5 px-4">Date & Slot</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Ref & Patient */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-700 text-[11px]">
                        {apt.appointmentNumber}
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                        <span>{apt.patientName}</span>
                        {apt.isWalkIn && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-semibold">
                            Walk-In
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{apt.patientPhone}</span>
                        </span>
                        {apt.patientEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{apt.patientEmail}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Service */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{apt.serviceName}</div>
                      {apt.notes && (
                        <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                          "{apt.notes}"
                        </div>
                      )}
                    </td>

                    {/* Dentist */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {apt.dentistName}
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 tabular-nums">
                      <div className="font-bold text-slate-900">{apt.date}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {apt.startTime} – {apt.endTime}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : apt.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : apt.status === 'completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'confirmed')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            title="Confirm appointment"
                          >
                            Confirm
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100"
                            title="Mark treatment completed"
                          >
                            Complete
                          </button>
                        )}

                        {/* Rescheduling is a front-desk/manager action (server rejects doctors) */}
                        {!isDoctor && (apt.status === 'pending' || apt.status === 'confirmed') && (
                          <button
                            onClick={() => {
                              setReschedulingApt(apt);
                              setRescheduleDate(apt.date);
                              setRescheduleTime(apt.startTime);
                              setRescheduleModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                          >
                            Reschedule
                          </button>
                        )}

                        {apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'cancelled')}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                            title="Cancel appointment"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= WALK-IN PATIENT BOOKING MODAL (EMAIL OPTIONAL) ================= */}
      {walkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Register Walk-In Patient
                </h3>
                <p className="text-xs text-slate-500">
                  Quick in-clinic registration by receptionist or staff.
                </p>
              </div>
              <button
                onClick={() => setWalkInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              {/* Patient First and Last Name Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dawit"
                    value={walkInForm.patientFirstName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, patientFirstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bekele"
                    value={walkInForm.patientLastName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, patientLastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+251 9XX XXX XXX or 09XXXXXXXX"
                    value={walkInForm.patientPhone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, patientPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="patient@example.com (optional)"
                    value={walkInForm.patientEmail}
                    onChange={(e) => setWalkInForm({ ...walkInForm, patientEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: '💵' },
                    { id: 'telebirr', label: 'Telebirr', icon: '📱' },
                    { id: 'cbe_birr', label: 'CBE Birr', icon: '🏦' },
                    { id: 'bank_transfer', label: 'Bank Transfer', icon: '💳' },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setWalkInForm({ ...walkInForm, paymentMethod: pm.id as any })}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        walkInForm.paymentMethod === pm.id
                          ? 'border-sky-600 bg-sky-50 text-sky-800 shadow-xs ring-1 ring-sky-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{pm.icon}</span>
                      <span>{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor / Dentist *
                  </label>
                  <select
                    value={walkInForm.dentistId}
                    onChange={(e) => setWalkInForm({ ...walkInForm, dentistId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Treatment / Service *
                  </label>
                  <select
                    value={walkInForm.serviceId}
                    onChange={(e) => setWalkInForm({ ...walkInForm, serviceId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (ETB {s.startingPrice})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={walkInForm.date}
                    onChange={(e) => setWalkInForm({ ...walkInForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time Slot *
                  </label>
                  {walkInAvailability && walkInAvailability.availableSlots.length > 0 ? (
                    <select
                      value={walkInForm.startTime}
                      onChange={(e) => setWalkInForm({ ...walkInForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      {walkInAvailability.availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-3 py-2 text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
                      {walkInAvailability && !walkInAvailability.isWorkingDay
                        ? 'This doctor is not working on the selected date.'
                        : 'No open slots for this doctor and treatment on the selected date.'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Walk-In Notes
                </label>
                <input
                  type="text"
                  value={walkInForm.notes}
                  onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkIn || !walkInForm.startTime}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingWalkIn ? 'Saving...' : 'Book Walk-In Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RESCHEDULE MODAL ================= */}
      {rescheduleModalOpen && reschedulingApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Reschedule Appointment
                </h3>
                <p className="text-xs text-slate-500">
                  {reschedulingApt.appointmentNumber} · {reschedulingApt.patientName}
                </p>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Time Slot
                </label>
                {rescheduleSlots.length === 0 ? (
                  <p className="text-xs text-rose-600">No open slots on selected date.</p>
                ) : (
                  <select
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {rescheduleSlots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRescheduling || !rescheduleTime}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
