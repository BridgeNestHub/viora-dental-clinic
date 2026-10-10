import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../../components/layout/SEOHead.js';
import { api } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.js';

export const ContactPage: React.FC = () => {
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    subject: 'Appointment & Consultation Inquiry',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone || !formData.message) {
      error('Please fill in your first name, last name, phone number, and message.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitContact({
        ...formData,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      });
      setSubmitted(true);
      success('Thank you! Your message has been received by our clinic reception.');
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        subject: 'Appointment & Consultation Inquiry',
        message: '',
      });
    } catch (err) {
      error('Could not deliver message. Please contact us directly by phone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 lg:py-16">
      <SEOHead
        pageKey="contact"
        fallbackTitle="Contact & Clinic Location | Viora Dental Center"
        fallbackDescription="Find our modern clinic in Bole Sub-City, Addis Ababa. View operating hours, direct phone line, and easily get directions."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
            Connect With Viora Dental
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 font-display text-balance">
            We Are Here to Listen & Care for Your Smile.
          </h1>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Have questions regarding treatment plans, emergency tooth care, or cosmetic consultations? Reach out via phone or send us an inquiry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 font-display">Clinic Information</h2>

              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Clinic Address</span>
                    <span className="text-xs leading-relaxed">
                      Medhanialem Mall Complex, 4th Floor, Suite 402, Bole Sub-City, Addis Ababa, Ethiopia
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Direct Lines</span>
                    <span className="text-xs block text-slate-700 font-medium">+251 911 234 567</span>
                    <span className="text-xs block text-slate-500">+251 116 634 890 (Reception)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Email Inquiries</span>
                    <span className="text-xs text-sky-700">info@vioradental.com</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Working Hours</span>
                    <span className="text-xs block text-slate-600">Mon – Fri: 8:30 AM – 6:30 PM (EAT)</span>
                    <span className="text-xs block text-slate-600">Saturday: 9:00 AM – 4:00 PM (EAT)</span>
                    <span className="text-xs block text-rose-500 font-medium">Sunday: Closed (Emergency on-call)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parking & Transit */}
            <div className="p-6 rounded-2xl bg-sky-900 text-white space-y-2">
              <h3 className="text-sm font-bold font-display">Accessibility & Parking</h3>
              <p className="text-xs text-sky-200 leading-relaxed">
                Dedicated basement parking available with high-speed elevator access to the 4th floor. Fully wheelchair accessible.
              </p>
            </div>
          </div>

          {/* Interactive Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 font-display mb-2">Send a Message</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Our clinical receptionist will respond within 2 business hours.
            </p>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-900">Message Delivered</h3>
                <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto">
                  Thank you for reaching out to Viora Dental Center. A member of our clinical desk will contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 px-4 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Almaz"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tadesse"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number (SMS / Call) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+251 9XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    How Can We Help You? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your dental symptoms, desired treatment, or consultation questions..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Delivering...' : 'Send Inquiry to Reception'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
