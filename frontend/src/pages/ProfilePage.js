import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Copy, Gift, TrendingUp, Award, Target } from 'lucide-react';

export default function ProfilePage() {
  const { user, wallet } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyReferral = () => {
    const link = `${window.location.origin}/signup?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const winRate = user?.stats?.totalBets > 0
    ? ((user.stats.totalWins / user.stats.totalBets) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="glass-card rounded-2xl p-6 mb-5 text-center">
        <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto mb-4">
          <User size={36} className="text-accent" />
        </div>
        <h1 className="font-display font-black text-2xl text-white mb-1">{user?.username}</h1>
        <p className="text-gray-500">{user?.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold capitalize">{user?.role}</span>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">🔥 {user?.loginStreak || 0} day streak</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Target, label: 'Total Bets', value: user?.stats?.totalBets || 0, color: 'text-white' },
          { icon: Award, label: 'Total Wins', value: user?.stats?.totalWins || 0, color: 'text-accent' },
          { icon: TrendingUp, label: 'Win Rate', value: `${winRate}%`, color: 'text-yellow-400' },
          { icon: Gift, label: 'Total Earned', value: `$${user?.stats?.totalEarned?.toFixed(2) || '0.00'}`, color: 'text-green-400' }
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <Icon size={20} className={`${color} mx-auto mb-2`} />
            <p className={`font-display font-bold text-lg ${color}`}>{value}</p>
            <p className="text-gray-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Wallet summary */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <h3 className="font-display font-bold text-white mb-4">Wallet Summary</h3>
        <div className="space-y-3">
          {[
            { label: 'Current Balance', value: `$${wallet.balance?.toFixed(2)}`, color: 'text-accent' },
            { label: 'Total Wagered', value: `$${user?.stats?.totalWagered?.toFixed(2) || '0.00'}`, color: 'text-white' },
            { label: 'Referrals', value: user?.referralCount || 0, color: 'text-purple-400' }
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <span className="text-gray-400 text-sm">{label}</span>
              <span className={`font-mono font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Referral */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gift size={18} className="text-accent" />
          <h3 className="font-display font-bold text-white">Referral Program</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">Invite friends and earn $10 for each signup!</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface border border-border rounded-xl px-4 py-3">
            <p className="text-gray-500 text-xs mb-0.5">Your code</p>
            <p className="font-mono font-bold text-white text-lg">{user?.referralCode}</p>
          </div>
          <button
            onClick={copyReferral}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
              copied ? 'bg-accent text-white' : 'bg-surface border border-border text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
