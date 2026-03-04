import React, { useMemo } from 'react';
import { usePrices } from '../../context/PriceContext';

export default function MiniChart({ coinId, width = 120, height = 40, color }) {
  const { priceHistory } = usePrices();
  const history = priceHistory[coinId] || [];

  const path = useMemo(() => {
    if (history.length < 2) return '';
    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = width;
    const h = height;
    const step = w / (prices.length - 1);

    return prices.map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [history, width, height]);

  const isUp = history.length >= 2 && history[history.length - 1]?.price >= history[0]?.price;
  const lineColor = color || (isUp ? '#1E9E56' : '#e53e3e');

  if (!path) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={lineColor} strokeWidth="1" strokeDasharray="3,3" />
      </svg>
    );
  }

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={`grad-${coinId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L${width},${height} L0,${height} Z`}
        fill={`url(#grad-${coinId})`}
      />
      <path d={path} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
