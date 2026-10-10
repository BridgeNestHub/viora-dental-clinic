// Clinic-local date/time helpers shared by the server and the browser.
// All scheduling uses the clinic's timezone, independent of the server's or visitor's timezone.

export const CLINIC_TIME_ZONE = 'Africa/Addis_Ababa';

const clinicFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Current clinic date (YYYY-MM-DD) and minutes since clinic midnight
export function getClinicNow(at: Date = new Date()): { dateStr: string; minutes: number } {
  const parts = clinicFormatter.formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value || '00';
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export function getClinicToday(): string {
  return getClinicNow().dateStr;
}

// Calendar arithmetic on YYYY-MM-DD strings (timezone-independent)
export function addDaysToDateStr(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Weekday index (0 = Sunday) of a YYYY-MM-DD string (timezone-independent)
export function getWeekdayIndex(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
