import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultRole = params.get('role') === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', role: defaultRole });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
      { label: 'Too short', color: 'bg-red-400' },
      { label: 'Weak', color: 'bg-orange-400' },
      { label: 'Fair', color: 'bg-amber-400' },
      { label: 'Good', color: 'bg-teal-400' },
      { label: 'Strong', color: 'bg-emerald-500' },
    ];
    return { score, ...levels[score] };
  };

  const strength = form.password ? passwordStrength(form.password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.register({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        phone: form.phone || undefined, role: form.role,
      });
      if (data.data) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        toast.success('Account created successfully!');
        navigate(form.role === 'DOCTOR' ? '/doctor/dashboard' : '/dashboard');
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Heart size={17} className="text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareSync</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create your account</h1>
          <p className="text-gray-500 mt-1">Join thousands managing their healthcare smarter</p>
        </div>

        <div className="card p-8">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
            {['PATIENT', 'DOCTOR'].map((r) => (
              <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${form.role === r ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {r === 'PATIENT' ? "🧑 I'm a Patient" : "👨‍⚕️ I'm a Doctor"}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input pl-9" placeholder="John" value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" placeholder="Doe" value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" className="input pl-9" placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="label">Phone (optional)</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" className="input pl-9" placeholder="+91 99999 99999" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} className="input pl-9 pr-10"
                  placeholder="Min. 8 characters" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`flex-1 rounded-full transition-all ${i < strength.score ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${strength.score >= 3 ? 'text-emerald-600' : 'text-gray-500'}`}>{strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" className={`input pl-9 pr-10 ${form.confirmPassword && form.password !== form.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Repeat password" value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500">
              By creating an account you agree to our{' '}
              <a href="#" className="text-primary-600 hover:underline">Terms</a> and{' '}
              <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>.
            </p>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : `Create ${form.role === 'DOCTOR' ? 'Doctor' : 'Patient'} Account`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
