import React, { useState, useEffect } from 'react';
import { Settings2, Save, Globe } from 'lucide-react';
import { api, PageSeo } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.js';

export const SeoManager: React.FC = () => {
  const { success, error } = useToast();
  const [seoData, setSeoData] = useState<Record<string, PageSeo>>({});
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSaving, setIsSaving] = useState(false);

  const pages = [
    { id: 'home', label: 'Home Page' },
    { id: 'services', label: 'Services Page' },
    { id: 'about', label: 'About / Doctors Page' },
    { id: 'gallery', label: 'Smile Gallery' },
    { id: 'blog', label: 'Dental Tips' },
    { id: 'contact', label: 'Contact Page' },
    { id: 'booking', label: 'Booking Page' },
  ];

  useEffect(() => {
    api.getSeoSettings().then((data) => setSeoData(data));
  }, []);

  const currentConfig: PageSeo = seoData[activeTab] || {
    page: activeTab,
    title: '',
    metaDescription: '',
    ogTitle: '',
    ogDescription: '',
    keywords: '',
  };

  const handleFieldChange = (field: keyof PageSeo, value: string) => {
    setSeoData((prev) => ({
      ...prev,
      [activeTab]: {
        ...currentConfig,
        [field]: value,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSeoPage(activeTab, currentConfig);
      success(`SEO settings saved for page '${activeTab}'!`);
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update SEO settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">
          SEO & OpenGraph Metadata Manager
        </h2>
        <p className="text-xs text-slate-500">
          Control page meta titles, descriptions, and OpenGraph social share cards directly from the Admin Panel.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Page Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                activeTab === p.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* SEO Form */}
        <form onSubmit={handleSave} className="space-y-5 max-w-3xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Page HTML Title (&lt;title&gt;)
            </label>
            <input
              type="text"
              required
              value={currentConfig.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Recommended: 50-60 characters including clinic brand.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meta Description
            </label>
            <textarea
              rows={3}
              value={currentConfig.metaDescription}
              onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            ></textarea>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Recommended: 140-160 characters describing clinical offerings and location.
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
              OpenGraph (Facebook / WhatsApp / LinkedIn Preview)
            </span>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                OG Title (og:title)
              </label>
              <input
                type="text"
                value={currentConfig.ogTitle}
                onChange={(e) => handleFieldChange('ogTitle', e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                OG Description (og:description)
              </label>
              <textarea
                rows={2}
                value={currentConfig.ogDescription}
                onChange={(e) => handleFieldChange('ogDescription', e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
              ></textarea>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target SEO Keywords (Comma separated)
            </label>
            <input
              type="text"
              value={currentConfig.keywords}
              onChange={(e) => handleFieldChange('keywords', e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              placeholder="dentist addis ababa, veneers ethiopia, bole dental clinic..."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving SEO...' : 'Save Meta Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
