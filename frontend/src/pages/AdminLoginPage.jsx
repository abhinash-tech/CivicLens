import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both administrator email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.adminLogin({
        email: email.trim(),
        password: password.trim(),
      });

      if (res?.success && res?.data?.token) {
        localStorage.setItem('civiclens_token', res.data.token);
        if (res.data.admin) {
          localStorage.setItem('civiclens_admin', JSON.stringify(res.data.admin));
        }
        navigate('/admin');
      } else {
        throw new Error(res?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || 'Invalid administrator email or password.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoCredentials = () => {
    setEmail('admin@civiclens.gov');
    setPassword('AdminSecureCivic2025!');
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-navy-950 text-white flex items-center justify-center mx-auto shadow-md">
            <Lock size={24} className="text-teal-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
            Municipal Admin Command Portal
          </h1>
          <p className="text-xs text-slate-500">
            Secure administrative sign-in for municipal officials and department coordinators.
          </p>
        </div>

        {/* Card */}
        <div className="card-subtle bg-white p-6 sm:p-8 space-y-5 border-slate-200 shadow-lg">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@civiclens.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:border-teal-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-navy-800 cursor-not-allowed opacity-90'
                  : 'bg-navy-950 hover:bg-navy-900 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Helper */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-center">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              Hackathon Evaluation Preset
            </span>
            <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/80 text-xs text-teal-900 text-left space-y-1">
              <div className="flex justify-between items-center font-medium">
                <span>Demo Admin Account:</span>
                <button
                  type="button"
                  onClick={autofillDemoCredentials}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
                >
                  Auto-Fill
                </button>
              </div>
              <div className="text-[11px] font-mono text-teal-800 space-y-0.5">
                <div>Email: admin@civiclens.gov</div>
                <div>Pass: AdminSecureCivic2025!</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-navy-900 transition-colors inline-flex items-center gap-1"
          >
            &larr; Return to Citizen Public Home
          </Link>
        </div>
      </div>
    </div>
  );
}
