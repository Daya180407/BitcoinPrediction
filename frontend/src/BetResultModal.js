import React, { useEffect } from 'react';
import { TrendingUp, TrendingDown, Trophy, X } from 'lucide-react';

export default function BetResultModal({ result, onClose }) {
  const isWin = result?.result === 'WIN';

  useEffect(() => {
    if (result) {
      // Play sound
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (isWin) {
          oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
          oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        } else {
          oscillator.frequency.setValueAtTime(300, ctx.currentTime);
          oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
        }

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      } catch {}

      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [result, isWin, onClose]);

  if (!result) return null;

  const priceDiff = result.endPrice - result.startPrice;
  const priceDiffPct = ((priceDiff / result.startPrice) * 100).toFixed(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`result-pop relative max-w-sm w-full rounded-2xl border-2 p-8 text-center ${
        isWin
          ? 'bg-accent/10 border-accent shadow-[0_0_40px_rgba(30,158,86,0.4)]'
          : 'bg-red-500/10 border-red-500 shadow-[0_0_40px_rgba(229,62,62,0.4)]'
      }`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isWin ? 'bg-accent/20' : 'bg-red-500/20'
        }`}>
          {isWin ? (
            <Trophy size={40} className="text-accent" />
          ) : (
            <TrendingDown size={40} className="text-red-400" />
          )}
        </div>

        <h2 className={`font-display font-black text-4xl mb-2 ${isWin ? 'text-accent text-glow' : 'text-red-400'}`}>
          {isWin ? 'YOU WON!' : 'YOU LOST'}
        </h2>

        <p className="text-gray-400 mb-6">
          {result.coinSymbol} went <strong className={isWin ? 'text-accent' : 'text-red-400'}>
            {priceDiff >= 0 ? 'UP' : 'DOWN'}
          </strong> {Math.abs(parseFloat(priceDiffPct))}%
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Start Price</p>
            <p className="font-mono font-bold text-white">${result.startPrice?.toLocaleString()}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">End Price</p>
            <p className={`font-mono font-bold ${priceDiff >= 0 ? 'text-accent' : 'text-red-400'}`}>
              ${result.endPrice?.toLocaleString()}
            </p>
          </div>
        </div>

        {isWin && (
          <div className="bg-accent/20 border border-accent/30 rounded-xl p-4 mb-4">
            <p className="text-gray-400 text-sm mb-1">Payout</p>
            <p className="font-display font-black text-3xl text-accent">
              +${result.payout?.toFixed(2)}
            </p>
          </div>
        )}

        <p className="text-gray-500 text-sm">
          Wallet: <span className="text-white font-mono font-bold">${result.walletBalance?.toFixed(2)}</span>
        </p>

        <button
          onClick={onClose}
          className={`mt-6 w-full py-3 rounded-xl font-display font-bold text-white transition-all ${
            isWin ? 'btn-up' : 'btn-down'
          }`}
        >
          {isWin ? '🎉 Play Again!' : '🔄 Try Again'}
        </button>
      </div>
    </div>
  );
}
