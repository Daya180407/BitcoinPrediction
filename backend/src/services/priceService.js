const axios = require('axios');

// In-memory price cache
const priceCache = {
  bitcoin: { price: 0, change24h: 0, lastUpdated: null },
  ethereum: { price: 0, change24h: 0, lastUpdated: null },
  solana: { price: 0, change24h: 0, lastUpdated: null },
  binancecoin: { price: 0, change24h: 0, lastUpdated: null }
};

const COIN_IDS = ['bitcoin', 'ethereum', 'solana', 'binancecoin'];
const COIN_SYMBOLS = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  binancecoin: 'BNB'
};

// Fetch prices from CoinGecko
const fetchPrices = async () => {
  try {
    const ids = COIN_IDS.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const headers = {};
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }

    const response = await axios.get(url, { headers, timeout: 10000 });
    const data = response.data;

    for (const coinId of COIN_IDS) {
      if (data[coinId]) {
        priceCache[coinId] = {
          price: data[coinId].usd,
          change24h: data[coinId].usd_24h_change?.toFixed(2) || 0,
          lastUpdated: new Date()
        };
      }
    }

    return priceCache;
  } catch (error) {
    console.error('Price fetch error:', error.message);
    // Return cached prices with slight simulation if API fails
    return simulatePriceUpdate();
  }
};

// Simulate price changes if API is unavailable
const simulatePriceUpdate = () => {
  const basePrices = {
    bitcoin: 67000,
    ethereum: 3500,
    solana: 180,
    binancecoin: 590
  };

  for (const coinId of COIN_IDS) {
    const base = priceCache[coinId].price || basePrices[coinId];
    const variation = (Math.random() - 0.5) * 0.002; // ±0.1%
    priceCache[coinId] = {
      price: parseFloat((base * (1 + variation)).toFixed(2)),
      change24h: priceCache[coinId].change24h || (Math.random() * 10 - 5).toFixed(2),
      lastUpdated: new Date()
    };
  }
  return priceCache;
};

// Get current price for a coin
const getPrice = (coinId) => {
  return priceCache[coinId]?.price || 0;
};

// Get all prices
const getAllPrices = () => {
  const result = {};
  for (const coinId of COIN_IDS) {
    result[coinId] = {
      ...priceCache[coinId],
      symbol: COIN_SYMBOLS[coinId],
      id: coinId
    };
  }
  return result;
};

// Start periodic price updates
let priceInterval = null;
const startPriceUpdater = (io) => {
  // Initial fetch
  fetchPrices().then(prices => {
    if (io) io.emit('priceUpdate', getAllPrices());
  });

  // Update every 5 seconds
  priceInterval = setInterval(async () => {
    await fetchPrices();
    if (io) {
      io.emit('priceUpdate', getAllPrices());
    }
  }, 5000);

  console.log('💹 Price updater started');
};

const stopPriceUpdater = () => {
  if (priceInterval) clearInterval(priceInterval);
};

module.exports = {
  startPriceUpdater,
  stopPriceUpdater,
  getPrice,
  getAllPrices,
  fetchPrices,
  COIN_IDS,
  COIN_SYMBOLS
};
