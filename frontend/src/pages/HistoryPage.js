import React, { useState, useEffect } from 'react';
import { gameAPI } from '../services/api';
import { TrendingUp, TrendingDown, History, Filter } from 'lucide-react';

export default function HistoryPage() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({ wins: 0, losses: 0, totalWagered: 0, totalEarned: 0 });

  useEffect(() => {
    fetchBets();
  }, [page, filter]);

  const fetchBets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      const { data } = await gameAPI.getHistory(params);
      let filtered = data.bets;

      if (filter === 'win') filtered = data.bets.filter(b => b.result === 'WIN');
      else if (filter === 'loss') filtered = data.bets.filter(b => b.result === 'LOSS');
      else if (filter === 'active') filtered = data.bets.filter(b => b.status === 'active');

      setBets(filtered);
      setPagination(data.pagination);

      // Calculate stats from all bets
      const allBets = data.bets;
      setStats({
        wins: allBets.filter(b => b.result === 'WIN').length,
        losses: allBets.filter(b => b.result === 'LOSS').length,
        totalWagered: allBets.reduce((s, b) => s + b.betAmount, 0),
        totalEarned: allBets.filter(b => b.result === 'WIN').reduce((s, b) => s + b.payout, 0)
      });
    } catch {}
    setLoading(false);
  };

  const coinColors = { BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF', BNB: '#F3BA2F' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <History size={24} className="text-accent" />
        <h1 className="font-display font-black text-2xl text-white">Bet History</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Wins', value: stats.wins, color: 'text-accent' },
          { label: 'Total Losses', value: stats.losses, color: 'text-red-400' },
          { label: 'Total Wagered', value: `$${stats.totalWagered.toFixed(2)}`, color: 'text-white' },
          { label: 'Total Earned', value: `$${stats.totalEarned.toFixed(2)}`, color: 'text-yellow-400' }
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className={`font-display font-bold text-lg ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={16} className="text-gray-500" />
        {['all', 'win', 'loss', 'active'].map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-accent text-white' : 'bg-surface border border-border text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bet list */}
      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : bets.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <History size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No bets found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bets.map(bet => {
            const priceDiff = bet.endPrice ? bet.endPrice - bet.startPrice : 0;
            const priceDiffPct = bet.startPrice ? ((priceDiff / bet.startPrice) * 100).toFixed(3) : 0;

            return (
              <div key={bet._id} className={`glass-card rounded-xl p-4 border transition-all ${
                bet.result === 'WIN' ? 'border-accent/20' :
                bet.result === 'LOSS' ? 'border-red-500/20' : 'border-border'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: `${coinColors[bet.coinSymbol]}20`, color: coinColors[bet.coinSymbol] }}
                    >
                      {bet.coinSymbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded ${
                          bet.direction === 'UP' ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {bet.direction === 'UP' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {bet.direction}
                        </span>
                        <span className="text-gray-500 text-sm">{bet.duration}s</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>Start: ${bet.startPrice?.toLocaleString()}</span>
                        {bet.endPrice && <span>End: ${bet.endPrice?.toLocaleString()}</span>}
                        {bet.endPrice && (
                          <span className={priceDiff >= 0 ? 'text-accent' : 'text-red-400'}>
                            {priceDiff >= 0 ? '+' : ''}{priceDiffPct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {bet.status === 'active' ? (
                      <span className="text-yellow-400 text-sm font-bold animate-pulse">LIVE</span>
                    ) : (
                      <div>
                        <p className={`font-mono font-bold ${bet.result === 'WIN' ? 'text-accent' : 'text-red-400'}`}>
                          {bet.result === 'WIN' ? `+$${bet.payout?.toFixed(2)}` : `-$${bet.betAmount}`}
                        </p>
                        <p className="text-gray-600 text-xs">{bet.result}</p>
                      </div>
                    )}
                    <p className="text-gray-600 text-xs mt-1">{new Date(bet.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                page === p ? 'bg-accent text-white' : 'bg-surface border border-border text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
