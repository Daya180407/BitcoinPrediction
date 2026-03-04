import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';
import { Trophy, TrendingUp, DollarSign, Crown } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [type, setType] = useState('wins');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await leaderboardAPI.get(type);
        setLeaderboard(data.leaderboard);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [type]);

  const rankStyle = (rank) => {
    if (rank === 1) return 'text-yellow-400 bg-yellow-400/10';
    if (rank === 2) return 'text-gray-300 bg-gray-300/10';
    if (rank === 3) return 'text-orange-400 bg-orange-400/10';
    return 'text-gray-500 bg-surface';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-yellow-400" />
        <h1 className="font-display font-black text-2xl text-white">Leaderboard</h1>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'wins', label: 'Most Wins', icon: Trophy },
          { id: 'earnings', label: 'Top Earners', icon: DollarSign },
          { id: 'winrate', label: 'Win Rate', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setType(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              type === id ? 'bg-accent text-white' : 'bg-surface border border-border text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((user) => (
            <div key={user.rank} className={`glass-card rounded-xl p-4 flex items-center gap-4 ${user.rank <= 3 ? 'border border-yellow-500/20' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm ${rankStyle(user.rank)}`}>
                {user.rank <= 3 ? <Crown size={18} /> : `#${user.rank}`}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">{user.username}</p>
                <p className="text-gray-500 text-xs">{user.totalBets} bets • {user.winRate}% win rate</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-accent">
                  {type === 'wins' ? `${user.totalWins} wins` :
                   type === 'earnings' ? `$${user.totalEarned?.toFixed(2)}` :
                   `${user.winRate}%`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
