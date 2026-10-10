import React, { useState, useEffect } from 'react';
import { BookOpen, PlusCircle, Edit2, Trash2, X, Clock, CheckCircle2 } from 'lucide-react';
import { api, BlogPost } from '../../api/index.js';
import { ImageUploadInput } from '../../components/ui/ImageUploadInput.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const DentalTipsManager: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Dental Health Tips',
    readTimeMinutes: 5,
    excerpt: '',
    content: '',
    coverImageUrl: '/src/assets/images/viora_smile_consultation_1791308064299.jpg',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPosts = () => {
    setIsLoading(true);
    api
      .getBlogPosts(true)
      .then((data) => setPosts(data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleOpenAdd = () => {
    setEditingPost(null);
    setForm({
      title: '',
      category: 'Oral Health Tips',
      readTimeMinutes: 5,
      excerpt: '',
      content: '',
      coverImageUrl: '/src/assets/images/viora_smile_consultation_1791308064299.jpg',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      category: post.category,
      readTimeMinutes: post.readTimeMinutes,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete article: "${title}"?`)) return;
    try {
      await api.deleteBlogPost(id);
      success(`Article "${title}" removed.`);
      loadPosts();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Could not delete article.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      error('Title and Content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPost) {
        await api.updateBlogPost(editingPost.id, form);
        success(`Article "${form.title}" updated!`);
      } else {
        await api.createBlogPost(form);
        success(`Article "${form.title}" published!`);
      }
      setModalOpen(false);
      loadPosts();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to save article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Dental Tips & Blog Editorial CMS
          </h2>
          <p className="text-xs text-slate-500">
            Publish educational articles and oral hygiene tips authored by Viora clinic doctors and staff.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Dental Tip</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading articles...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Title & Excerpt</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Published Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{post.title}</div>
                      <div className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                        {post.excerpt}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                        {post.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{post.authorName}</div>
                      <div className="text-[10px] text-slate-400">{post.authorRole}</div>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-slate-600">{post.publishedAt}</td>
                    <td className="py-3.5 px-4 text-right">
                      {/* Doctors may only manage articles they authored (enforced by the API) */}
                      {user?.role === 'doctor' && post.authorId !== user.id ? (
                        <span className="text-[11px] text-slate-400">Authored by another clinician</span>
                      ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                      )}
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display">
                {editingPost ? 'Edit Dental Tip' : 'Publish New Dental Tip'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 Habits That Silently Damage Tooth Enamel"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Est. Reading Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.readTimeMinutes}
                    onChange={(e) => setForm({ ...form, readTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <ImageUploadInput
                  label="Article / Dental Tip Cover Photo *"
                  value={form.coverImageUrl}
                  onChange={(url) => setForm({ ...form, coverImageUrl: url })}
                  aspectRatio="video"
                  placeholder="https://... or choose photo from computer"
                  helperText="Upload article banner photo from computer (JPG, PNG, WEBP) or enter web link"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Excerpt / Teaser
                </label>
                <textarea
                  rows={2}
                  placeholder="1-2 sentences summarizing the advice..."
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Article Content *
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Write clear, engaging dental hygiene advice for patients. Supports markdown headings (###) and bullet lists (- )."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
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
                  {isSubmitting ? 'Saving...' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
