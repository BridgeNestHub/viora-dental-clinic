import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { SEOHead } from '../../components/layout/SEOHead.js';
import { api, GalleryItem } from '../../api/index.js';

export const GalleryPage: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getGallery()
      .then((data) => setItems(data))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = [
    { id: 'all', label: 'All Results' },
    { id: 'Veneers & Aesthetics', label: 'Veneers & Aesthetics' },
    { id: 'Teeth Whitening', label: 'Teeth Whitening' },
    { id: 'Orthodontics', label: 'Clear Aligners & Ortho' },
    { id: 'Dental Implants', label: 'Dental Implants' },
    { id: 'Clinic Facilities', label: 'Clinic Environment' },
  ];

  const filtered =
    activeCategory === 'all'
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <div className="bg-slate-50 min-h-screen py-12 lg:py-16">
      <SEOHead
        pageKey="gallery"
        fallbackTitle="Before & After Smile Gallery | Viora Dental Center"
        fallbackDescription="Browse real clinical patient transformations: side-by-side before and after comparisons for porcelain veneers, orthodontic aligners, and teeth whitening."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
            Clinical Case Portfolio
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 font-display text-balance">
            Before & After Clinical Transformations
          </h1>
          <p className="text-base text-slate-600 mt-2">
            Authentic patient outcomes treated exclusively by Viora specialists. Direct side-by-side before and after comparison of smile transformations and clinic facilities.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Loading smile transformation cases...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Before/After Case vs Facility Single Image */}
                {item.isBeforeAfter && item.beforeImageUrl && item.afterImageUrl ? (
                  /* Side-by-Side View Exclusively */
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2.5 rounded-2xl overflow-hidden bg-slate-950 p-1 border border-slate-200">
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                        <img
                          src={item.beforeImageUrl}
                          alt={`${item.title} Before Treatment`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase border border-white/10 shadow-sm">
                          Before
                        </div>
                      </div>
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                        <img
                          src={item.afterImageUrl}
                          alt={`${item.title} After Treatment`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute bottom-2.5 left-2.5 bg-sky-600/95 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase border border-sky-400/20 shadow-sm">
                          After
                        </div>
                      </div>
                    </div>
                    <div className="px-1 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">{item.title}</span>
                      {item.doctorName && (
                        <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-medium">
                          Dr. {item.doctorName.replace(/^Dr\.\s*/i, '')}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Single Facility / Interior Photo */
                  <div className="rounded-2xl overflow-hidden aspect-[16/9] relative bg-slate-900 group">
                    <img
                      src={item.singleImageUrl || item.afterImageUrl || ''}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-sky-400" />
                      <span>{item.category}</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <span className="text-xs text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded font-medium">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
