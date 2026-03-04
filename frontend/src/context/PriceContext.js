import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { gameAPI } from '../services/api';

const PriceContext = createContext(null);

const COIN_INFO = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', icon: '₿' },
  ethereum: { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', icon: 'Ξ' },
  solana: { symbol: 'SOL', name: 'Solana', color: '#9945FF', icon: '◎' },
  binancecoin: { symbol: 'BNB', name: 'BNB', color: '#F3BA2F', icon: 'B' }
};

export const PriceProvider = ({ children }) => {
  const [prices, setPrices] = useState({});
  const [priceHistory, setPriceHistory] = useState({
    bitcoin: [], ethereum: [], solana: [], binancecoin: []
  });
  const prevPrices = useRef({});

  useEffect(() => {
    // Initial price fetch
    const fetchInitial = async () => {
      try {
        const { data } = await gameAPI.getPrices();
        if (data.prices) {
          const enriched = {};
          for (const [id, info] of Object.entries(data.prices)) {
            enriched[id] = { ...info, ...COIN_INFO[id], direction: 'neutral' };
          }
          setPrices(enriched);
          prevPrices.current = enriched;
        }
      } catch (err) {
        console.error('Price fetch error:', err);
      }
    };
    fetchInitial();

    // Listen to socket
    const socket = getSocket();
    if (socket) {
      socket.on('priceUpdate', (newPrices) => {
        setPrices(prev => {
          const updated = {};
          for (const [id, data] of Object.entries(newPrices)) {
            const prevPrice = prev[id]?.price || 0;
            const newPrice = data.price;
            updated[id] = {
              ...data,
              ...COIN_INFO[id],
              direction: newPrice > prevPrice ? 'up' : newPrice < prevPrice ? 'down' : 'neutral',
              prevPrice
            };
          }

          // Update price history
          setPriceHistory(hist => {
            const newHist = { ...hist };
            for (const id of Object.keys(updated)) {
              const point = {
                time: Date.now(),
                price: updated[id].price
              };
              newHist[id] = [...(hist[id] || []).slice(-60), point];
            }
            return newHist;
          });

          return updated;
        });
      });
    }

    // Fallback polling if no socket
    const interval = setInterval(async () => {
      const socket = getSocket();
      if (!socket?.connected) {
        try {
          const { data } = await gameAPI.getPrices();
          if (data.prices) {
            setPrices(prev => {
              const updated = {};
              for (const [id, info] of Object.entries(data.prices)) {
                const prevPrice = prev[id]?.price || 0;
                updated[id] = {
                  ...info,
                  ...COIN_INFO[id],
                  direction: info.price > prevPrice ? 'up' : info.price < prevPrice ? 'down' : 'neutral'
                };
              }
              return updated;
            });
          }
        } catch {}
      }
    }, 8000);

    return () => {
      clearInterval(interval);
      const socket = getSocket();
      if (socket) socket.off('priceUpdate');
    };
  }, []);

  return (
    <PriceContext.Provider value={{ prices, priceHistory, COIN_INFO }}>
      {children}
    </PriceContext.Provider>
  );
};

export const usePrices = () => {
  const context = useContext(PriceContext);
  if (!context) throw new Error('usePrices must be used within PriceProvider');
  return context;
};
