import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, Gift } from 'lucide-react';

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    referralCode: searchParams.get('ref') || ''
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      return toast.error('Please fill all required fields');
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      await signup(form);
      toast.success('Account created! Welcome to the Arena! 🎮');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#051520] bg-grid flex items-center justify-center p-4">
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 mb-4">
            <Zap size={32} className="text-accent" />
          </div>
          <h1 className="font-display font-black text-3xl text-white">
            Join the <span className="text-accent">Arena</span>
          </h1>
          <p className="text-gray-500 mt-2">Create your account and start predicting</p>
        </div>

        {/* Welcome bonus banner */}
        <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl p-3 mb-6">
          <Gift size={20} className="text-accent flex-shrink-0" />
          <p className="text-sm text-gray-300">
            Get <span className="text-accent font-bold">$5 welcome bonus</span> on signup!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="crypto_warrior"
              maxLength={20}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 characters"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors pr-12"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Referral Code <span className="text-gray-600">(optional)</span></label>
            <input
              type="text"
              value={form.referralCode}
              onChange={e => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-display font-bold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1E9E56, #25bf68)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-light font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
