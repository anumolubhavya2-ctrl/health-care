import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Patient', email: 'patient@caresync.health', password: 'Patient@123', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: 'Doctor', email: 'dr.priya.sharma@caresync.health', password: 'Doctor@123', color: 'bg-teal-50 border-teal-200 text-teal-700' },
    { label: 'Admin', email: 'admin@caresync.health', password: 'Admin@123', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-teal-700 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/5"
              style={{ width: `${100 + i * 60}px`, height: `${100 + i * 60}px`, top: `${5 + i * 18}%`, left: `${8 + i * 10}%` }} />
          ))}
        </div>
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <span className="text-2xl font-bold text-white">CareSync</span>
        </Link>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Healthcare appointments,<br />without the uncertainty.
          </h2>
          <p className="text-primary-200 text-lg leading-relaxed">
            Track your queue, know your doctor's live status, and get transparent pricing — all in one place.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {['Live Queue Tracking', 'Real-time Doctor Status', 'Instant Refunds', 'Human Support'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-primary-100">
                <div className="w-1.5 h-1.5 bg-teal-300 rounded-full" /><span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-primary-300 text-sm relative z-10">Trusted by thousands of patients across India</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden justify-center">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
              <Heart size={16} className="text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareSync</span>
          </Link>

          <div className="card p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
            </div>

            {/* Demo accounts */}
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 mb-2">Quick demo sign-in:</p>
              <div className="flex gap-2 flex-wrap">
                {demoAccounts.map((acc) => (
                  <button key={acc.label} type="button"
                    onClick={() => setForm({ email: acc.email, password: acc.password })}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all hover:opacity-80 ${acc.color}`}>
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" className="input pl-10" placeholder="you@example.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required autoComplete="email" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label !mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10"
                    placeholder="••••••••" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-medium hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
