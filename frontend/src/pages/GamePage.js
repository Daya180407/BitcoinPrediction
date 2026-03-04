import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrices } from '../context/PriceContext';
import { gameAPI } from '../services/api';
import { getSocket } from '../services/socket';
import toast from 'react-hot-toast';
import CoinSelector from '../components/game/CoinSelector';
import CountdownTimer from '../components/game/CountdownTimer';
import BetResultModal from '../components/game/BetResultModal';
import MiniChart from '../components/game/MiniChart';
import {
  TrendingUp, TrendingDown, Clock, Zap, DollarSign,
  History, ChevronRight, AlertCircle
} from 'lucide-react';

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];
const DURATIONS = [15, 30, 60];
const COIN_COLORS = {
  bitcoin: '#F7931A', ethereum: '#627EEA', solana: '#9945FF', binancecoin: '#F3BA2F'
};

export default function GamePage() {
  const { wallet, updateWalletBalance } = useAuth();
  const { prices } = usePrices();

  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [betAmount, setBetAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [activeBet, setActiveBet] = useState(null);
  const [recentBets, setRecentBets] = useState([]);
  const [betResult, setBetResult] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [config, setConfig] = useState({ payoutMultiplier: 1.8, minBetAmount: 1, maxBetAmount: 100 });

  const currentPrice = prices[selectedCoin];
  const potentialPayout = (betAmount * config.payoutMultiplier).toFixed(2);

  useEffect(() => {
    fetchActiveBet();
    fetchRecentBets();
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchActiveBet();
  }, [selectedCoin]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleBetResult = (result) => {
      setBetResult(result);
      setActiveBet(null);
      updateWalletBalance(result.walletBalance);
      fetchRecentBets();
    };

    socket.on('betResult', handleBetResult);
    return () => socket.off('betResult', handleBetResult);
  }, [updateWalletBalance]);

  const fetchConfig = async () => {
    try {
      const { data } = await gameAPI.getConfig();
      setConfig(data.config);
    } catch {}
  };

  const fetchActiveBet = async () => {
    try {
      const { data } = await gameAPI.getActiveBet(selectedCoin);
      setActiveBet(data.bet);
    } catch {}
  };

  const fetchRecentBets = async () => {
    try {
      const { data } = await gameAPI.getHistory({ limit: 5 });
      setRecentBets(data.bets || []);
    } catch {}
  };

  const handlePlaceBet = async (direction) => {
    const amount = customAmount ? parseFloat(customAmount) : betAmount;

    if (!amount || amount < config.minBetAmount || amount > config.maxBetAmount) {
      return toast.error(`Bet must be $${config.minBetAmount}–$${config.maxBetAmount}`);
    }
    if (wallet.balance < amount) {
      return toast.error('Insufficient wallet balance');
    }
    if (activeBet) {
      return toast.error('You already have an active bet on this coin');
    }

    const coinSymbols = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', binancecoin: 'BNB' };

    setIsPlacing(true);
    try {
      const { data } = await gameAPI.placeBet({
        coin: selectedCoin,
        coinSymbol: coinSymbols[selectedCoin],
        direction,
        betAmount: amount,
        duration: selectedDuration
      });

      setActiveBet(data.bet);
      updateWalletBalance(data.walletBalance);
      toast.success(`Bet placed! Predicting ${direction} for ${selectedDuration}s 🚀`);
      setCustomAmount('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place bet');
    } finally {
      setIsPlacing(false);
    }
  };

  const handleTimerComplete = () => {
    toast('Resolving bet...', { icon: '⏱️' });
  };

  const activeBetTimeLeft = activeBet
    ? Math.max(0, Math.floor((new Date(activeBet.createdAt).getTime() + activeBet.duration * 1000 - Date.now()) / 1000))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT: Coin selector + Game panel */}
        <div className="xl:col-span-2 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-black text-2xl text-white">
                Prediction <span className="text-accent">Arena</span>
              </h1>
              <p className="text-gray-500 text-sm">Predict the market. Win crypto.</p>
            </div>
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl px-4 py-2">
              <DollarSign size={16} className="text-accent" />
              <span className="font-mono font-bold text-white">${wallet.balance?.toFixed(2)}</span>
            </div>
          </div>

          {/* Coin Selector */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={16} className="text-accent" /> Select Coin
            </h3>
            <CoinSelector selectedCoin={selectedCoin} onSelect={setSelectedCoin} />
          </div>

          {/* Live Price Display */}
          {currentPrice && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-gray-400 text-sm">{currentPrice.name} Live Price</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`font-display font-black text-4xl num-change ${
                        currentPrice.direction === 'up' ? 'text-accent' : currentPrice.direction === 'down' ? 'text-red-400' : 'text-white'
                      }`}
                    >
                      ${currentPrice.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      parseFloat(currentPrice.change24h) >= 0 ? 'text-accent' : 'text-red-400'
                    }`}>
                      {parseFloat(currentPrice.change24h) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(parseFloat(currentPrice.change24h) || 0).toFixed(2)}% 24h
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <span className="text-accent text-xs font-medium">LIVE</span>
                </div>
              </div>
              <MiniChart coinId={selectedCoin} width={600} height={80} color={COIN_COLORS[selectedCoin]} />
            </div>
          )}

          {/* Game Controls */}
          <div className="glass-card rounded-2xl p-5 space-y-5">
            {/* Duration */}
            <div>
              <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                <Clock size={16} className="text-accent" /> Time Duration
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`py-3 rounded-xl font-display font-bold text-sm transition-all ${
                      selectedDuration === d
                        ? 'bg-accent text-white shadow-[0_0_15px_rgba(30,158,86,0.3)]'
                        : 'bg-surface border border-border text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Amount */}
            <div>
              <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                <DollarSign size={16} className="text-accent" /> Bet Amount
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {BET_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => { setBetAmount(a); setCustomAmount(''); }}
                    disabled={a > wallet.balance}
                    className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                      betAmount === a && !customAmount
                        ? 'bg-accent text-white'
                        : 'bg-surface border border-border text-gray-400 hover:border-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="Custom amount"
                  min={config.minBetAmount}
                  max={Math.min(config.maxBetAmount, wallet.balance)}
                  className="w-full bg-surface border border-border rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono"
                />
              </div>
            </div>

            {/* Payout preview */}
            <div className="bg-surface rounded-xl p-4 flex items-center justify-between border border-border">
              <div>
                <p className="text-gray-500 text-xs">Potential Payout</p>
                <p className="font-mono font-bold text-accent text-xl">${customAmount ? (parseFloat(customAmount) * config.payoutMultiplier).toFixed(2) : potentialPayout}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">Multiplier</p>
                <p className="font-display font-bold text-white">{config.payoutMultiplier}x</p>
              </div>
            </div>

            {/* Active bet display */}
            {activeBet ? (
              <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-accent font-bold text-sm">Active Bet - {activeBet.coinSymbol}</p>
                    <p className="text-white font-display font-black text-2xl">
                      {activeBet.direction === 'UP' ? '📈' : '📉'} {activeBet.direction}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      ${activeBet.betAmount} @ ${activeBet.startPrice?.toLocaleString()}
                    </p>
                  </div>
                  <CountdownTimer
                    duration={activeBet.duration}
                    isActive={true}
                    onComplete={handleTimerComplete}
                  />
                </div>
              </div>
            ) : (
              /* UP/DOWN buttons */
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handlePlaceBet('UP')}
                  disabled={isPlacing || !currentPrice}
                  className="btn-up py-5 rounded-2xl font-display font-black text-xl text-white flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp size={28} />
                  UP
                  <span className="text-sm font-normal opacity-80">Price goes higher</span>
                </button>
                <button
                  onClick={() => handlePlaceBet('DOWN')}
                  disabled={isPlacing || !currentPrice}
                  className="btn-down py-5 rounded-2xl font-display font-black text-xl text-white flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingDown size={28} />
                  DOWN
                  <span className="text-sm font-normal opacity-80">Price goes lower</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Recent bets + stats */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display font-bold text-white mb-4">Your Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Balance', value: `$${wallet.balance?.toFixed(2) || '0.00'}`, color: 'text-accent' },
                { label: 'Potential Win', value: `$${customAmount ? (parseFloat(customAmount) * config.payoutMultiplier).toFixed(2) : potentialPayout}`, color: 'text-yellow-400' },
                { label: 'Duration', value: `${selectedDuration}s`, color: 'text-blue-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-gray-500 text-sm">{label}</span>
                  <span className={`font-mono font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent History */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <History size={16} className="text-accent" /> Recent Bets
              </h3>
              <a href="/history" className="text-accent text-xs flex items-center gap-1 hover:text-accent-light">
                View all <ChevronRight size={12} />
              </a>
            </div>

            {recentBets.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No bets yet. Start playing!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentBets.map(bet => (
                  <div key={bet._id} className={`flex items-center justify-between p-3 rounded-xl border ${
                    bet.result === 'WIN' ? 'bg-accent/5 border-accent/20' :
                    bet.result === 'LOSS' ? 'bg-red-500/5 border-red-500/20' :
                    'bg-surface border-border'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{bet.coinSymbol}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                          bet.direction === 'UP' ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'
                        }`}>{bet.direction}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">${bet.betAmount} • {bet.duration}s</p>
                    </div>
                    <div className="text-right">
                      {bet.status === 'active' ? (
                        <span className="text-yellow-400 text-xs font-bold animate-pulse">LIVE</span>
                      ) : (
                        <span className={`text-xs font-bold ${
                          bet.result === 'WIN' ? 'text-accent' : 'text-red-400'
                        }`}>
                          {bet.result === 'WIN' ? `+$${bet.payout?.toFixed(2)}` : `-$${bet.betAmount}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How to play */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display font-bold text-white mb-3">How to Play</h3>
            <div className="space-y-3">
              {[
                { n: '1', t: 'Select a coin to predict' },
                { n: '2', t: 'Choose UP or DOWN direction' },
                { n: '3', t: 'Pick your bet amount' },
                { n: '4', t: 'Set time duration' },
                { n: '5', t: 'Win 1.8x if correct!' }
              ].map(({ n, t }) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</div>
                  <p className="text-gray-400 text-sm">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bet Result Modal */}
      {betResult && (
        <BetResultModal result={betResult} onClose={() => setBetResult(null)} />
      )}
    </div>
  );
}
