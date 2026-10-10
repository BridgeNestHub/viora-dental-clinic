import { Appointment } from '../db/store.js';

export interface EmailDispatchResult {
  sent: boolean;
  messageId: string;
  recipient: string;
  subject: string;
  previewText: string;
}

/**
 * Service to handle booking confirmations and reminders.
 * Logs cleanly and handles optional email gracefully.
 */
export async function sendBookingConfirmationEmail(
  appointment: Appointment
): Promise<EmailDispatchResult | null> {
  if (!appointment.patientEmail || !appointment.patientEmail.includes('@')) {
    console.log(
      `[EmailService] Notice: No patient email provided for appointment ${appointment.appointmentNumber} (Patient: ${appointment.patientName}). Skipping email delivery.`
    );
    return null;
  }

  const subject = `Your Dental Visit Confirmation - Viora Dental Center (${appointment.appointmentNumber})`;
  const previewText = `Confirmed: ${appointment.serviceName} with ${appointment.dentistName} on ${appointment.date} at ${appointment.startTime}`;

  console.log(`[EmailService] 📧 Dispatching Confirmation Email:
    To: ${appointment.patientEmail}
    Subject: ${subject}
    Booking Reference: ${appointment.appointmentNumber}
    Doctor: ${appointment.dentistName}
    Service: ${appointment.serviceName}
    Date & Time: ${appointment.date} at ${appointment.startTime}
    Location: Viora Dental Center, Bole Sub-City, Addis Ababa, Ethiopia
  `);

  return {
    sent: true,
    messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    recipient: appointment.patientEmail,
    subject,
    previewText,
  };
}

export async function send24HourReminderEmail(
  appointment: Appointment
): Promise<EmailDispatchResult | null> {
  if (!appointment.patientEmail) return null;

  const subject = `Reminder: Dental Visit Tomorrow at Viora Dental Center (${appointment.startTime})`;
  const previewText = `Reminder for your upcoming visit with ${appointment.dentistName}`;

  console.log(`[EmailService] ⏰ Dispatching 24h Reminder:
    To: ${appointment.patientEmail}
    Subject: ${subject}
    Appointment: ${appointment.appointmentNumber}
  `);

  return {
    sent: true,
    messageId: `msg-remind-${Date.now()}`,
    recipient: appointment.patientEmail,
    subject,
    previewText,
  };
}
