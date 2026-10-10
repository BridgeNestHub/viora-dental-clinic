import React, { useState, useEffect } from 'react';
import { Stethoscope, PlusCircle, Edit2, Trash2, X } from 'lucide-react';
import { api, DentalService } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.js';

export const ServicesManager: React.FC = () => {
  const { success, error } = useToast();
  const [services, setServices] = useState<DentalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<DentalService | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'general' as DentalService['category'],
    startingPrice: 1500,
    durationMinutes: 30,
    description: '',
    isPopular: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadServices = () => {
    setIsLoading(true);
    api
      .getServices()
      .then((data) => setServices(data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setForm({
      name: '',
      category: 'general',
      startingPrice: 1500,
      durationMinutes: 30,
      description: '',
      isPopular: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s: DentalService) => {
    setEditingService(s);
    setForm({
      name: s.name,
      category: s.category,
      startingPrice: s.startingPrice,
      durationMinutes: s.durationMinutes,
      description: s.description,
      isPopular: s.isPopular,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete service: "${name}"?`)) return;
    try {
      await api.deleteService(id);
      success(`Service "${name}" removed.`);
      loadServices();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Could not delete service.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startingPrice) {
      error('Service name and price are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingService) {
        await api.updateService(editingService.id, form);
        success(`Service "${form.name}" updated!`);
      } else {
        await api.createService(form);
        success(`Service "${form.name}" created!`);
      }
      setModalOpen(false);
      loadServices();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to save service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Clinical Services & Fees
          </h2>
          <p className="text-xs text-slate-500">
            Configure clinical treatments, baseline pricing (ETB), appointment durations, and descriptions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading services...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Service Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Baseline Price (ETB)</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{s.name}</div>
                      <div className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                        {s.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-600">
                      {s.category.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                      ETB {s.startingPrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">{s.durationMinutes} mins</td>
                    <td className="py-3.5 px-4">
                      {s.isPopular && (
                        <span className="text-[10px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                          Popular
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display">
                {editingService ? 'Edit Clinical Service' : 'Add New Clinical Service'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="general">General</option>
                    <option value="cosmetic">Cosmetic</option>
                    <option value="orthodontics">Orthodontics</option>
                    <option value="implants">Implants</option>
                    <option value="whitening">Whitening</option>
                    <option value="root_canal">Root Canal</option>
                    <option value="pediatric">Pediatric</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price in ETB *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={form.startingPrice}
                    onChange={(e) => setForm({ ...form, startingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPopular}
                      onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600"
                    />
                    <span>Highlight as Popular</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                ></textarea>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
