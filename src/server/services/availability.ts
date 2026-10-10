import { Dentist, Appointment, loadDatabase } from '../db/store.js';
import {
  getClinicNow,
  getWeekdayIndex,
  minutesToTime,
  timeToMinutes,
} from '../../shared/clinicTime.js';

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

// Start times are offered on a fixed 30-minute grid; the treatment duration decides whether a start time fits
const SLOT_STEP_MINUTES = 30;
// Same-day online slots must start at least this far in the future
const SAME_DAY_LEAD_MINUTES = 15;

export interface AvailabilityResult {
  date: string;
  dentistId: string;
  dentistName: string;
  isWorkingDay: boolean;
  workingHours?: { start: string; end: string };
  availableSlots: string[];
  bookedSlots: string[];
}

export type SlotCheckResult = { ok: true } | { ok: false; status: 400 | 409; message: string };

function isWorkingDate(dentist: Dentist, dateStr: string): boolean {
  const dayOfWeek = DAY_NAMES[getWeekdayIndex(dateStr)];
  const worksOnDay = dentist.workingDays.map((d) => d.toLowerCase()).includes(dayOfWeek);
  const isDayOff = (dentist.daysOff || []).includes(dateStr);
  return worksOnDay && !isDayOff;
}

function getBookedRanges(
  appointments: Appointment[],
  dentistId: string,
  dateStr: string,
  excludeAppointmentId?: string
): { start: number; end: number }[] {
  return appointments
    .filter(
      (apt) =>
        apt.dentistId === dentistId &&
        apt.date === dateStr &&
        apt.status !== 'cancelled' &&
        apt.id !== excludeAppointmentId
    )
    .map((apt) => {
      const start = timeToMinutes(apt.startTime);
      const end = apt.endTime ? timeToMinutes(apt.endTime) : start + SLOT_STEP_MINUTES;
      return { start, end: end > start ? end : start + SLOT_STEP_MINUTES };
    });
}

function overlapsAny(start: number, end: number, ranges: { start: number; end: number }[]): boolean {
  return ranges.some((range) => start < range.end && range.start < end);
}

/**
 * Validates a requested appointment slot against the doctor's schedule, the clinic clock,
 * and existing bookings (time ranges, not just identical start times).
 */
export function checkSlot(
  dentist: Dentist,
  dateStr: string,
  startTime: string,
  durationMinutes: number,
  appointments: Appointment[],
  excludeAppointmentId?: string
): SlotCheckResult {
  if (!isWorkingDate(dentist, dateStr)) {
    return { ok: false, status: 400, message: `${dentist.name} is not available on ${dateStr}.` };
  }

  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  const workStart = timeToMinutes(dentist.workingHours.start);
  const workEnd = timeToMinutes(dentist.workingHours.end);
  if (start < workStart || end > workEnd) {
    return {
      ok: false,
      status: 400,
      message: `Selected time is outside ${dentist.name}'s working hours (${dentist.workingHours.start}–${dentist.workingHours.end}).`,
    };
  }

  const now = getClinicNow();
  if (dateStr < now.dateStr || (dateStr === now.dateStr && start <= now.minutes)) {
    return { ok: false, status: 400, message: 'Selected appointment time is in the past.' };
  }

  if (overlapsAny(start, end, getBookedRanges(appointments, dentist.id, dateStr, excludeAppointmentId))) {
    return {
      ok: false,
      status: 409,
      message: 'This time slot was just booked by another patient. Please choose a different slot.',
    };
  }

  return { ok: true };
}

/**
 * Calculates slot availability for a dentist on a specific date.
 */
export function getDentistAvailability(
  dentistId: string,
  dateStr: string,
  durationMinutes: number = SLOT_STEP_MINUTES,
  excludeAppointmentId?: string
): AvailabilityResult {
  const db = loadDatabase();
  const dentist = db.dentists.find((d) => d.id === dentistId && d.isActive);

  if (!dentist) {
    return {
      date: dateStr,
      dentistId,
      dentistName: 'Unknown Dentist',
      isWorkingDay: false,
      availableSlots: [],
      bookedSlots: [],
    };
  }

  if (!isWorkingDate(dentist, dateStr)) {
    return {
      date: dateStr,
      dentistId: dentist.id,
      dentistName: dentist.name,
      isWorkingDay: false,
      workingHours: dentist.workingHours,
      availableSlots: [],
      bookedSlots: [],
    };
  }

  const workStart = timeToMinutes(dentist.workingHours.start);
  const workEnd = timeToMinutes(dentist.workingHours.end);
  const bookedRanges = getBookedRanges(db.appointments, dentist.id, dateStr, excludeAppointmentId);

  // Exclude times that have already passed when the date is today (clinic time)
  const now = getClinicNow();
  const isToday = dateStr === now.dateStr;
  const isPastDate = dateStr < now.dateStr;

  const availableSlots: string[] = [];
  for (let start = workStart; start + durationMinutes <= workEnd; start += SLOT_STEP_MINUTES) {
    if (isPastDate) break;
    if (isToday && start <= now.minutes + SAME_DAY_LEAD_MINUTES) continue;
    if (overlapsAny(start, start + durationMinutes, bookedRanges)) continue;
    availableSlots.push(minutesToTime(start));
  }

  return {
    date: dateStr,
    dentistId: dentist.id,
    dentistName: dentist.name,
    isWorkingDay: true,
    workingHours: dentist.workingHours,
    availableSlots,
    bookedSlots: bookedRanges.map((range) => minutesToTime(range.start)),
  };
}
