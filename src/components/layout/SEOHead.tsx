import React, { useEffect } from 'react';
import { api, PageSeo } from '../../api/index.js';

interface SEOHeadProps {
  pageKey: 'home' | 'services' | 'about' | 'gallery' | 'blog' | 'contact' | 'booking';
  fallbackTitle: string;
  fallbackDescription: string;
  // When true, the fallback title/description win over admin page settings (e.g. individual articles)
  preferFallback?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  pageKey,
  fallbackTitle,
  fallbackDescription,
  preferFallback = false,
}) => {
  useEffect(() => {
    let isMounted = true;

    api
      .getSeoSettings()
      .then((settings) => {
        if (!isMounted) return;
        const pageConfig: PageSeo | undefined = preferFallback ? undefined : settings[pageKey];

        const title = pageConfig?.title || fallbackTitle;
        const description = pageConfig?.metaDescription || fallbackDescription;
        const ogTitle = pageConfig?.ogTitle || title;
        const ogDescription = pageConfig?.ogDescription || description;

        document.title = title;

        // Update meta tags
        const updateMeta = (name: string, content: string) => {
          let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
          if (!el) {
            el = document.createElement('meta');
            if (name.startsWith('og:')) {
              el.setAttribute('property', name);
            } else {
              el.setAttribute('name', name);
            }
            document.head.appendChild(el);
          }
          el.setAttribute('content', content);
        };

        updateMeta('description', description);
        updateMeta('og:title', ogTitle);
        updateMeta('og:description', ogDescription);
      })
      .catch(() => {
        document.title = fallbackTitle;
      });

    return () => {
      isMounted = false;
    };
  }, [pageKey, fallbackTitle, fallbackDescription, preferFallback]);

  return null;
};
