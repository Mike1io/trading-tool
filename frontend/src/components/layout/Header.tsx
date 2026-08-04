'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Wifi, WifiOff, ShieldCheck, Flame } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

export function Header() {
  const { isConnected } = useWebSocket();
  const [unreadNotifications] = useState(3);
  const [prices, setPrices] = useState({
    BTC: { price: '0', change: 0 },
    ETH: { price: '0', change: 0 },
    SOL: { price: '0', change: 0 },
  });

  useEffect(() => {
    async function fetchLivePrices() {
      try {
        const res = await fetch(
          'https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D'
        );
        if (res.ok) {
          const data = await res.json();
          const pMap: any = {};
          for (const item of data) {
            const sym = item.symbol.replace('USDT', '');
            pMap[sym] = {
              price: Number(item.lastPrice).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              change: Number(Number(item.priceChangePercent).toFixed(2)),
            };
          }
          setPrices((prev) => ({ ...prev, ...pMap }));
        }
      } catch (err) {
        console.error('Error fetching live crypto prices:', err);
      }
    }

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-tv-card border-b border-tv-border px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-tv-card/90">
      {/* Search Input Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-tv-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search wallet 0x..., tx hash, token (ETH, SOL), exchange..."
            className="w-full bg-tv-bg border border-tv-border rounded-lg pl-10 pr-4 py-1.5 text-xs text-tv-heading placeholder:text-tv-muted focus:outline-none focus:border-tv-blue focus:ring-1 focus:ring-tv-blue transition-all"
          />
        </div>
      </div>

      {/* Market Tickers & Status Controls */}
      <div className="flex items-center gap-5">
        {/* Ticker Badges */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono border-r border-tv-border pr-5">
          <div className="flex items-center gap-1.5">
            <span className="text-tv-muted">ETH:</span>
            <span className="font-semibold text-tv-heading">${prices.ETH.price}</span>
            <span className={`text-[10px] font-bold ${prices.ETH.change >= 0 ? 'text-tv-green' : 'text-tv-red'}`}>
              {prices.ETH.change >= 0 ? `+${prices.ETH.change}%` : `${prices.ETH.change}%`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-tv-muted">BTC:</span>
            <span className="font-semibold text-tv-heading">${prices.BTC.price}</span>
            <span className={`text-[10px] font-bold ${prices.BTC.change >= 0 ? 'text-tv-green' : 'text-tv-red'}`}>
              {prices.BTC.change >= 0 ? `+${prices.BTC.change}%` : `${prices.BTC.change}%`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-tv-muted">SOL:</span>
            <span className="font-semibold text-tv-heading">${prices.SOL.price}</span>
            <span className={`text-[10px] font-bold ${prices.SOL.change >= 0 ? 'text-tv-green' : 'text-tv-red'}`}>
              {prices.SOL.change >= 0 ? `+${prices.SOL.change}%` : `${prices.SOL.change}%`}
            </span>
          </div>
        </div>

        {/* Real-time WebSocket Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium ${
            isConnected
              ? 'bg-tv-green/10 border-tv-green/30 text-tv-green'
              : 'bg-tv-red/10 border-tv-red/30 text-tv-red'
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span>WS LIVE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>RECONNECTING</span>
            </>
          )}
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 text-tv-muted hover:text-tv-heading hover:bg-tv-hover rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-tv-red text-white text-[9px] font-bold flex items-center justify-center border-2 border-tv-card">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* Security / Pro Badge */}
        <div className="flex items-center gap-2 border-l border-tv-border pl-4">
          <div className="w-8 h-8 rounded-full bg-tv-surface border border-tv-border flex items-center justify-center text-tv-cyan">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
