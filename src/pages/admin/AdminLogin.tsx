import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { VioraLogo } from '../../components/common/VioraLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('Admin@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = await login(username, password);
    setIsSubmitting(false);

    if (res.success) {
      success('Authenticated successfully. Welcome to Viora Clinic Portal.');
      navigate('/admin/dashboard');
    } else {
      setErrorMessage(res.message || 'Invalid username or password.');
      error(res.message || 'Login failed.');
    }
  };

  const handleDemoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-block mb-4">
          <VioraLogo size="lg" variant="light" />
        </Link>
        <h2 className="text-2xl font-bold text-white tracking-tight font-display">
          Staff & Clinic Administration
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Sign in to access appointment management, doctor records, and clinic CMS.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  placeholder="e.g. superadmin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          {/* Quick Demo Credentials Preset Selector */}
          <div className="pt-4 border-t border-slate-700">
            <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Demo Credentials (Click to Fill):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoFill('superadmin', 'Admin@123')}
                className="p-2 text-left bg-slate-900/60 hover:bg-slate-900 rounded-lg border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-bold text-sky-400">Super Admin</div>
                <div className="text-[10px] text-slate-400">superadmin / Admin@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('reception', 'Staff@123')}
                className="p-2 text-left bg-slate-900/60 hover:bg-slate-900 rounded-lg border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-bold text-emerald-400">Receptionist</div>
                <div className="text-[10px] text-slate-400">reception / Staff@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('doc_manager', 'Staff@123')}
                className="p-2 text-left bg-slate-900/60 hover:bg-slate-900 rounded-lg border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-bold text-purple-400">Doctor Manager</div>
                <div className="text-[10px] text-slate-400">doc_manager / Staff@123</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('dr_selamawit', 'Staff@123')}
                className="p-2 text-left bg-slate-900/60 hover:bg-slate-900 rounded-lg border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-bold text-teal-400">Doctor (Clinical)</div>
                <div className="text-[10px] text-slate-400">dr_selamawit / Staff@123</div>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Clinic Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
