import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, PlusCircle, Trash2, ShieldCheck } from 'lucide-react';
import { api, Doctor } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.js';

const WEEKDAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

export const ScheduleManager: React.FC = () => {
  const { success, error } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>('08:30');
  const [endTime, setEndTime] = useState<string>('17:30');
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [newDayOff, setNewDayOff] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.getDentists(true).then((data) => {
      setDoctors(data);
      if (data.length > 0) {
        setSelectedDocId(data[0].id);
        setWorkingDays(data[0].workingDays || []);
        setStartTime(data[0].workingHours?.start || '08:30');
        setEndTime(data[0].workingHours?.end || '17:30');
        setDaysOff(data[0].daysOff || []);
      }
    });
  }, []);

  const handleDoctorChange = (id: string) => {
    setSelectedDocId(id);
    const doc = doctors.find((d) => d.id === id);
    if (doc) {
      setWorkingDays(doc.workingDays || []);
      setStartTime(doc.workingHours?.start || '08:30');
      setEndTime(doc.workingHours?.end || '17:30');
      setDaysOff(doc.daysOff || []);
    }
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddDayOff = () => {
    if (!newDayOff) return;
    if (daysOff.includes(newDayOff)) {
      error('Day is already added.');
      return;
    }
    setDaysOff([...daysOff, newDayOff]);
    setNewDayOff('');
  };

  const handleRemoveDayOff = (date: string) => {
    setDaysOff(daysOff.filter((d) => d !== date));
  };

  const handleSave = async () => {
    if (!selectedDocId) return;
    setIsSaving(true);
    try {
      await api.updateDentistSchedule(selectedDocId, {
        workingDays,
        workingHours: { start: startTime, end: endTime },
        daysOff,
      });
      success('Doctor schedule & working hours updated!');
      // Update local copy
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === selectedDocId
            ? { ...d, workingDays, workingHours: { start: startTime, end: endTime }, daysOff }
            : d
        )
      );
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to save schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDocId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">
          Doctor Working Hours & Days Off
        </h2>
        <p className="text-xs text-slate-500">
          Configure clinical shifts and schedule exceptions used by the real-time availability slot generator.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-8">
        {/* Doctor Selector */}
        <div className="max-w-md">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Select Specialist Doctor
          </label>
          <select
            value={selectedDocId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.specialization}
              </option>
            ))}
          </select>
        </div>

        {selectedDoctor && (
          <div className="space-y-6 pt-4 border-t border-slate-100">
            {/* Working Days Checkboxes */}
            <div>
              <span className="block text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">
                Active Clinical Days
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {WEEKDAYS.map((day) => {
                  const active = workingDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        active
                          ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs">{day.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shift Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Shift Start Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Shift End Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Designated Days Off / Leaves */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Doctor Days Off / Leave Calendar
              </span>
              <p className="text-xs text-slate-500">
                On these specific dates, all appointment booking slots for this doctor will be marked unavailable.
              </p>

              <div className="flex items-center gap-3 max-w-md">
                <input
                  type="date"
                  value={newDayOff}
                  onChange={(e) => setNewDayOff(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleAddDayOff}
                  className="px-3.5 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-200 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Day Off</span>
                </button>
              </div>

              {daysOff.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {daysOff.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-xl"
                    >
                      <span>{date}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDayOff(date)}
                        className="text-rose-500 hover:text-rose-700 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm"
              >
                {isSaving ? 'Saving Changes...' : 'Save Doctor Schedule'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
