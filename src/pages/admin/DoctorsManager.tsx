import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  PlusCircle,
  Edit2,
  Trash2,
  GraduationCap,
  Clock,
  X,
} from 'lucide-react';
import { api, Doctor } from '../../api/index.js';
import { ImageUploadInput } from '../../components/ui/ImageUploadInput.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const DoctorsManager: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);

  // Form state with First Name and Last Name split
  const [form, setForm] = useState({
    titlePrefix: 'Dr.',
    firstName: '',
    lastName: '',
    title: 'Senior Dental Surgeon',
    specialization: '',
    bio: '',
    email: '',
    phone: '',
    qualifications: '',
    experienceYears: 5,
    photoUrl: '/src/assets/images/viora_dentist_doctor_1791308053834.jpg',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDoctors = () => {
    setIsLoading(true);
    api
      .getDentists(true)
      .then((data) => setDoctors(data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleOpenAdd = () => {
    setEditingDoc(null);
    setForm({
      titlePrefix: 'Dr.',
      firstName: '',
      lastName: '',
      title: 'Dental Surgeon',
      specialization: '',
      bio: '',
      email: '',
      phone: '',
      qualifications: '',
      experienceYears: 5,
      photoUrl: '/src/assets/images/viora_dentist_doctor_1791308053834.jpg',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoc(doc);
    // Parse first name and last name if not explicitly set
    let parsedFirstName = doc.firstName || '';
    let parsedLastName = doc.lastName || '';
    if (!parsedFirstName && !parsedLastName && doc.name) {
      const cleanName = doc.name.replace(/^(Dr\.|Doctor|Prof\.)\s*/i, '').trim();
      const parts = cleanName.split(' ');
      parsedFirstName = parts[0] || '';
      parsedLastName = parts.slice(1).join(' ') || '';
    }

    setForm({
      titlePrefix: doc.titlePrefix || 'Dr.',
      firstName: parsedFirstName,
      lastName: parsedLastName,
      title: doc.title,
      specialization: doc.specialization,
      bio: doc.bio,
      email: doc.email,
      phone: doc.phone,
      qualifications: doc.qualifications,
      experienceYears: doc.experienceYears,
      photoUrl: doc.photoUrl,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete doctor profile for ${name}?`)) {
      return;
    }
    try {
      await api.deleteDentist(id);
      success(`Doctor profile for ${name} removed.`);
      loadDoctors();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Could not delete doctor.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.specialization.trim()) {
      error('Doctor First Name, Last Name, and Specialization are required.');
      return;
    }

    const resolvedFullName = `${form.titlePrefix ? form.titlePrefix + ' ' : 'Dr. '}${form.firstName.trim()} ${form.lastName.trim()}`;

    const payload = {
      ...form,
      name: resolvedFullName,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
    };

    setIsSubmitting(true);
    try {
      if (editingDoc) {
        await api.updateDentist(editingDoc.id, payload);
        success(`Doctor profile for ${resolvedFullName} updated!`);
      } else {
        await api.createDentist(payload);
        success(`New doctor profile for ${resolvedFullName} created!`);
      }
      setModalOpen(false);
      loadDoctors();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to save doctor profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Doctor Profile Management
          </h2>
          <p className="text-xs text-slate-500">
            Add, update, or remove clinic specialists, credentials, and bios. Upload profile headshots directly from your device or via web link.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Grid of Doctor Cards */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading doctor profiles...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={doc.photoUrl}
                  alt={doc.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-100 shrink-0 shadow-inner"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 truncate">{doc.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        doc.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {doc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-sky-700 mt-0.5">{doc.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{doc.specialization}</div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.experienceYears}+ years clinical experience</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                  <span>{doc.qualifications}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  {doc.phone && <span>Phone: {doc.phone}</span>}
                  {doc.email && <span>Email: {doc.email}</span>}
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{doc.bio}</p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(doc)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => handleDelete(doc.id, doc.name)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display">
                {editingDoc ? 'Edit Doctor Profile' : 'Add New Doctor Profile'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Doctor First Name & Last Name Split */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Title Prefix
                  </label>
                  <select
                    value={form.titlePrefix}
                    onChange={(e) => setForm({ ...form, titlePrefix: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Dr. (Surgeon)">Dr. (Surgeon)</option>
                    <option value="Dr. (Consultant)">Dr. (Consultant)</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Selamawit"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bekele"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title / Role Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Aesthetic & Implant Dental Surgeon"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cosmetic Dentistry & Oral Implantology"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Years of Clinical Experience
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Degrees & Fellowship Qualifications
                </label>
                <input
                  type="text"
                  placeholder="e.g. DDS (Addis Ababa), MSc Aesthetic Dentistry (Frankfurt), Fellow ICOI"
                  value={form.qualifications}
                  onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Clinical Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+251 911 234 567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Email
                  </label>
                  <input
                    type="email"
                    placeholder="doctor@vioradental.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* DOCTOR PROFILE PHOTO: UPLOAD FROM COMPUTER OR LINK */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <ImageUploadInput
                  label="Doctor Profile Photo *"
                  value={form.photoUrl}
                  onChange={(url) => setForm({ ...form, photoUrl: url })}
                  aspectRatio="portrait"
                  placeholder="https://... or choose photo from computer"
                  helperText="Upload doctor professional portrait from computer (JPG, PNG) or enter image link"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biography & Clinical Practice Philosophy
                </label>
                <textarea
                  rows={4}
                  placeholder="Doctor's clinical background, international certifications, and patient care philosophy..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                ></textarea>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Saving Doctor...' : 'Save Doctor Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
