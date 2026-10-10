import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CalendarCheck, Share2 } from 'lucide-react';
import { SEOHead } from '../../components/layout/SEOHead.js';
import { api, BlogPost } from '../../api/index.js';

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (slug) {
      api
        .getBlogPostBySlug(slug)
        .then((data) => setPost(data))
        .catch(() => setPost(null))
        .finally(() => setIsLoading(false));
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-24 text-center text-slate-400">Loading dental advice...</div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Article Not Found</h2>
        <p className="text-slate-500 mt-2">The requested dental tip might have been moved or updated.</p>
        <Link to="/blog" className="inline-block mt-4 text-sky-600 font-semibold underline">
          Back to all articles
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 lg:py-16">
      <SEOHead
        pageKey="blog"
        fallbackTitle={`${post.title} | Viora Dental Center`}
        fallbackDescription={post.excerpt}
        preferFallback
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dental Tips</span>
        </Link>

        {/* Article Header */}
        <div className="space-y-4 mb-8">
          <div className="inline-flex text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-md">
            {post.category}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 font-display text-balance leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-y border-slate-200 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{post.authorName}</span>
              <span className="text-slate-400">({post.authorRole})</span>
            </div>
            <span>·</span>
            <span>Published {post.publishedAt}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readTimeMinutes} min read</span>
            </span>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="rounded-3xl overflow-hidden mb-10 aspect-[16/9] shadow-md bg-slate-900">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6 text-slate-700 text-base leading-relaxed">
          {post.content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-xl font-bold text-slate-900 pt-4 font-display">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('- ')) {
              const items = paragraph.split('\n- ');
              return (
                <ul key={idx} className="list-disc pl-5 space-y-2 text-slate-700">
                  {items.map((item, i) => (
                    <li key={i}>{item.replace(/^- /, '')}</li>
                  ))}
                </ul>
              );
            }
            if (paragraph.match(/^\d\.\s/)) {
              const items = paragraph.split(/\n(?=\d\.\s)/);
              return (
                <ol key={idx} className="list-decimal pl-5 space-y-2 text-slate-700">
                  {items.map((item, i) => (
                    <li key={i}>{item.replace(/^\d\.\s/, '')}</li>
                  ))}
                </ol>
              );
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 p-8 rounded-3xl bg-sky-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl font-bold font-display">Have Questions About Your Dental Health?</h3>
            <p className="text-xs sm:text-sm text-sky-200 mt-1">
              Book a personal consultation with our clinic specialists in Bole, Addis Ababa.
            </p>
          </div>
          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold text-sky-950 bg-white hover:bg-sky-50 rounded-xl transition-colors shrink-0 shadow-sm"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Book Visit</span>
          </Link>
        </div>
      </article>
    </div>
  );
};
