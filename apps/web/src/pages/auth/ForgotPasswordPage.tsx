import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Heart size={17} className="text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareSync</span>
          </Link>
        </div>
        <div className="card p-8">
          {!submitted ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
                <p className="text-gray-500 mt-1">Enter your email and we'll send a reset link</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" className="input pl-9" placeholder="you@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full">Send Reset Link</button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
            </div>
          )}
          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft size={15} />Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
