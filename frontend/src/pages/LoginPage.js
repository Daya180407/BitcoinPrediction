import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');

    setLoading(true);
    try {
      const data = await login(form);
      if (data.loginBonus) {
        toast.success(`Welcome back! +$${data.loginBonus} daily bonus! 🎁`);
      } else {
        toast.success(`Welcome back, ${data.user.username}!`);
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#051520] bg-grid flex items-center justify-center p-4">
      {/* Glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 mb-4">
            <Zap size={32} className="text-accent" />
          </div>
          <h1 className="font-display font-black text-3xl text-white">
            Crypto <span className="text-accent">Arena</span>
          </h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
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
                placeholder="••••••••"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-display font-bold text-white bg-accent hover:bg-accent-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: loading ? '#167a42' : 'linear-gradient(135deg, #1E9E56, #25bf68)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>

          {/* Demo accounts */}
          <div className="border-t border-border pt-4">
            <p className="text-gray-500 text-sm text-center mb-3">Demo accounts:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setForm({ email: 'whale@demo.com', password: 'Demo@1234' }); }}
                className="text-xs bg-surface border border-border rounded-lg px-3 py-2 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
              >
                User Demo
              </button>
              <button
                type="button"
                onClick={() => { setForm({ email: 'admin@cryptoarena.com', password: 'Admin@123456' }); }}
                className="text-xs bg-surface border border-border rounded-lg px-3 py-2 text-yellow-400 hover:border-yellow-500 transition-all"
              >
                Admin Demo
              </button>
            </div>
          </div>
        </form>

        <p className="text-center text-gray-500 mt-6">
          No account?{' '}
          <Link to="/signup" className="text-accent hover:text-accent-light font-medium transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
