import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePrices } from '../../context/PriceContext';
import MiniChart from './MiniChart';

const COIN_LOGOS = {
  bitcoin: '₿',
  ethereum: 'Ξ',
  solana: '◎',
  binancecoin: 'Ƀ'
};

const COIN_COLORS = {
  bitcoin: '#F7931A',
  ethereum: '#627EEA',
  solana: '#9945FF',
  binancecoin: '#F3BA2F'
};

export default function CoinSelector({ selectedCoin, onSelect, activeBets = {} }) {
  const { prices } = usePrices();

  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.values(prices).map(coin => {
        const isSelected = selectedCoin === coin.id;
        const isUp = parseFloat(coin.change24h) >= 0;
        const hasActiveBet = activeBets[coin.id];
        const color = COIN_COLORS[coin.id] || '#1E9E56';

        return (
          <button
            key={coin.id}
            onClick={() => onSelect(coin.id)}
            className={`relative p-4 rounded-xl border transition-all text-left group ${
              isSelected
                ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(30,158,86,0.2)]'
                : 'border-border bg-card hover:border-gray-600 hover:bg-surface'
            }`}
          >
            {hasActiveBet && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
            )}

            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {COIN_LOGOS[coin.id]}
                </div>
                <div>
                  <p className="font-display font-bold text-white text-sm">{coin.symbol}</p>
                  <p className="text-gray-500 text-xs">{coin.name}</p>
                </div>
              </div>
              <MiniChart coinId={coin.id} width={60} height={25} color={color} />
            </div>

            <div>
              <p className="font-mono font-bold text-white text-sm">
                ${coin.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '--'}
              </p>
              <div className={`flex items-center gap-1 mt-0.5 ${isUp ? 'text-accent' : 'text-red-400'}`}>
                {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                <span className="text-xs font-medium">{Math.abs(parseFloat(coin.change24h) || 0).toFixed(2)}%</span>
              </div>
            </div>

            {isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-b-xl" />
            )}
          </button>
        );
      })}
    </div>
  );
}
