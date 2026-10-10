import React, { useState, useEffect } from 'react';
import { Images, PlusCircle, Edit2, Trash2, X, Camera } from 'lucide-react';
import { api, GalleryItem } from '../../api/index.js';
import { ImageUploadInput } from '../../components/ui/ImageUploadInput.js';
import { useToast } from '../../context/ToastContext.js';

export const GalleryManager: React.FC = () => {
  const { success, error } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Veneers & Aesthetics',
    description: '',
    beforeImageUrl: '',
    afterImageUrl: '',
    singleImageUrl: '',
    isBeforeAfter: true,
    doctorName: 'Dr. Selamawit Bekele',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGallery = () => {
    setIsLoading(true);
    api
      .getGallery()
      .then((data) => setItems(data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      title: '',
      category: 'Veneers & Aesthetics',
      description: '',
      beforeImageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
      afterImageUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
      singleImageUrl: '',
      isBeforeAfter: true,
      doctorName: 'Dr. Selamawit Bekele',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      category: item.category,
      description: item.description,
      beforeImageUrl: item.beforeImageUrl || '',
      afterImageUrl: item.afterImageUrl || '',
      singleImageUrl: item.singleImageUrl || '',
      isBeforeAfter: item.isBeforeAfter,
      doctorName: item.doctorName || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete gallery case: "${title}"?`)) return;
    try {
      await api.deleteGalleryItem(id);
      success(`Gallery case "${title}" removed.`);
      loadGallery();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Could not delete item.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      error('Title is required.');
      return;
    }

    if (form.isBeforeAfter && (!form.beforeImageUrl || !form.afterImageUrl)) {
      error('Please provide both Before and After photos (upload from computer or enter link).');
      return;
    }

    if (!form.isBeforeAfter && !form.singleImageUrl) {
      error('Please provide a facility photo (upload from computer or enter link).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.updateGalleryItem(editingItem.id, form);
        success(`Gallery case "${form.title}" updated.`);
      } else {
        await api.createGalleryItem(form);
        success(`New gallery case "${form.title}" added.`);
      }
      setModalOpen(false);
      loadGallery();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to save gallery item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Smile Transformations & Gallery CMS
          </h2>
          <p className="text-xs text-slate-500">
            Showcase clinical results with side-by-side comparison. Upload photos directly from your computer or provide web links.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Before/After Case</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading gallery items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
            >
              {item.isBeforeAfter && item.beforeImageUrl && item.afterImageUrl ? (
                /* Side-by-Side Preview */
                <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden bg-slate-950 p-1 border border-slate-200">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                    <img
                      src={item.beforeImageUrl}
                      alt={`${item.title} Before`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                      Before
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                    <img
                      src={item.afterImageUrl}
                      alt={`${item.title} After`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 bg-sky-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                      After
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 relative">
                  <img
                    src={item.singleImageUrl || item.afterImageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Camera className="w-3 h-3 text-sky-400" />
                    <span>Clinic Facility</span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  {item.doctorName && (
                    <span className="text-[11px] text-slate-500">{item.doctorName}</span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Edit Case"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Delete Case"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display">
                {editingItem ? 'Edit Gallery Case' : 'Add New Clinical Transformation Case'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Case Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8-Unit Porcelain Veneer Makeover"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Veneers & Aesthetics">Veneers & Aesthetics</option>
                    <option value="Teeth Whitening">Teeth Whitening</option>
                    <option value="Orthodontics">Clear Aligners & Ortho</option>
                    <option value="Dental Implants">Dental Implants</option>
                    <option value="Clinic Facilities">Clinic Facilities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Treating Doctor
                  </label>
                  <input
                    type="text"
                    value={form.doctorName}
                    onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Case Type Toggle */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium">
                <span className="text-slate-700 font-semibold">Upload Format:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isBeforeAfter"
                    checked={form.isBeforeAfter}
                    onChange={() => setForm({ ...form, isBeforeAfter: true })}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Before & After Pair</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isBeforeAfter"
                    checked={!form.isBeforeAfter}
                    onChange={() => setForm({ ...form, isBeforeAfter: false })}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span>Single Facility / Clinic Image</span>
                </label>
              </div>

              {/* PHOTO UPLOADS: DIRECT FROM COMPUTER OR URL */}
              {form.isBeforeAfter ? (
                <div className="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block">
                    Before & After Photos (Upload from computer or paste web links)
                  </span>

                  <ImageUploadInput
                    label='1. "Before" Clinical Photo *'
                    value={form.beforeImageUrl}
                    onChange={(url) => setForm({ ...form, beforeImageUrl: url })}
                    placeholder="https://... or choose photo from computer"
                    helperText="Select or drag patient's pre-treatment clinical photo"
                  />

                  <ImageUploadInput
                    label='2. "After" Transformation Photo *'
                    value={form.afterImageUrl}
                    onChange={(url) => setForm({ ...form, afterImageUrl: url })}
                    placeholder="https://... or choose photo from computer"
                    helperText="Select or drag patient's post-treatment transformed smile photo"
                  />
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                  <ImageUploadInput
                    label="Facility / Clinic Interior Photo *"
                    value={form.singleImageUrl}
                    onChange={(url) => setForm({ ...form, singleImageUrl: url })}
                    placeholder="https://... or choose photo from computer"
                    helperText="Upload reception, operatory suite, sterilization bay, or lounge photo"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Case Description & Outcomes
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail clinical findings, shade match, materials used, and patient satisfaction..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  {isSubmitting ? 'Saving Case...' : 'Save Gallery Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
