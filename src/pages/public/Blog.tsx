import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight, User } from 'lucide-react';
import { SEOHead } from '../../components/layout/SEOHead.js';
import { api, BlogPost } from '../../api/index.js';

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getBlogPosts()
      .then((data) => setPosts(data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-12 lg:py-16">
      <SEOHead
        pageKey="blog"
        fallbackTitle="Dental Health Tips & Expert Articles | Viora Dental"
        fallbackDescription="Practical oral hygiene tips, orthodontic guides, and pediatric dental advice written by our practicing dental clinicians."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
            Dental Tips & Patient Education
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 font-display text-balance">
            Expert Oral Health & Aesthetic Advice
          </h1>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Written directly by our practicing clinicians at Viora Dental Center to help you preserve natural teeth, prevent enamel erosion, and maintain long-lasting smile radiance.
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Loading articles...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="aspect-[16/10] bg-slate-900 overflow-hidden relative">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold px-3 py-1 rounded-md shadow-sm">
                      {post.category}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span>{post.publishedAt}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.readTimeMinutes} min read</span>
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                      <Link to={`/blog/${post.slug || post.id}`}>{post.title}</Link>
                    </h2>

                    <p className="text-sm text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px]">
                      {post.authorName.charAt(0)}
                    </div>
                    <span>{post.authorName}</span>
                  </div>

                  <Link
                    to={`/blog/${post.slug || post.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
