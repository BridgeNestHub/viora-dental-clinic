import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Mail, CheckCircle2, Trash2, Clock } from 'lucide-react';
import { api, ContactMessage } from '../../api/index.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';

export const MessagesManager: React.FC = () => {
  const { success, error } = useToast();
  const { user } = useAuth();
  // Matches the API: only super admins and receptionists may delete inquiries
  const canDelete = user?.role === 'super_admin' || user?.role === 'receptionist';
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = () => {
    setIsLoading(true);
    api
      .getContactMessages()
      .then((data) => setMessages(data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleStatusToggle = async (id: string, current: string) => {
    const nextStatus = current === 'unread' ? 'read' : 'unread';
    try {
      await api.updateMessageStatus(id, nextStatus);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: nextStatus as any } : m))
      );
    } catch (err: any) {
      error('Failed to update status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this inquiry message?')) return;
    try {
      await api.deleteMessage(id);
      success('Inquiry removed.');
      loadMessages();
    } catch (err: any) {
      error('Failed to remove inquiry.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Patient Inquiries & Messages
          </h2>
          <p className="text-xs text-slate-500">
            Incoming inquiries submitted through the public website contact form.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading inquiries...</div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No patient inquiries yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-6 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  msg.status === 'unread' ? 'bg-sky-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        msg.status === 'unread'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {msg.status}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{msg.name}</h3>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {new Date(msg.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-sky-800">{msg.subject}</div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200/60">
                    {msg.message}
                  </p>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <a
                      href={`tel:${msg.phone}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-sky-600"
                    >
                      <Phone className="w-3.5 h-3.5 text-sky-600" />
                      <span>{msg.phone}</span>
                    </a>
                    {msg.email && (
                      <a
                        href={`mailto:${msg.email}`}
                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-sky-600"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{msg.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => handleStatusToggle(msg.id, msg.status)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Mark {msg.status === 'unread' ? 'Read' : 'Unread'}
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
