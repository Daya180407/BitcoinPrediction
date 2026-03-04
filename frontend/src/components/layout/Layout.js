import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePrices } from '../../context/PriceContext';
import {
  Home, Wallet, History, Trophy, User, LogOut,
  Menu, X, Shield, TrendingUp, TrendingDown
} from 'lucide-react';

const PriceTicker = () => {
  const { prices } = usePrices();
  const items = Object.values(prices).filter(p => p.price);

  const renderItem = (coin, i) => (
    <span key={`${coin.id}-${i}`} className="inline-flex items-center gap-2 mx-8">
      <span className="font-bold text-white font-mono">{coin.symbol}</span>
      <span className="font-mono text-sm text-gray-200">${coin.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span className={`text-xs flex items-center gap-1 ${parseFloat(coin.change24h) >= 0 ? 'text-accent' : 'text-red-400'}`}>
        {parseFloat(coin.change24h) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {Math.abs(parseFloat(coin.change24h) || 0).toFixed(2)}%
      </span>
    </span>
  );

  if (!items.length) return null;

  return (
    <div className="bg-primary border-b border-border overflow-hidden py-2">
      <div className="ticker-wrap">
        <div className="ticker-move">
          {items.map((coin, i) => renderItem(coin, i))}
          {items.map((coin, i) => renderItem(coin, i + items.length))}
        </div>
      </div>
    </div>
  );
};

const navItems = [
  { path: '/', label: 'Arena', icon: Home },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/history', label: 'History', icon: History },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/profile', label: 'Profile', icon: User }
];

export default function Layout({ children }) {
  const { user, wallet, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#051520] flex flex-col">
      {/* Ticker */}
      <PriceTicker />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-primary/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-white font-display font-black text-sm">CA</span>
              </div>
              <span className="font-display font-bold text-white text-lg hidden sm:block">
                Crypto <span className="text-accent">Arena</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === path
                      ? 'bg-accent/10 text-accent border border-accent/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-yellow-400 hover:bg-yellow-400/10 transition-all">
                  <Shield size={15} /> Admin
                </Link>
              )}
            </div>

            {/* Wallet + user */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
                <Wallet size={14} className="text-accent" />
                <span className="font-mono text-sm font-bold text-white">
                  ${wallet?.balance?.toFixed(2) || '0.00'}
                </span>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <span className="text-gray-400 text-sm">{user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-primary p-4 space-y-2">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
              <span className="text-white font-medium">{user?.username}</span>
              <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
                <Wallet size={14} className="text-accent" />
                <span className="font-mono text-sm font-bold text-white">${wallet?.balance?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === path ? 'bg-accent/10 text-accent' : 'text-gray-400'
                }`}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-yellow-400">
                <Shield size={16} /> Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 w-full"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="flex-1 bg-grid">
        {children}
      </main>
    </div>
  );
}
