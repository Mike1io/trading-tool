'use client';

import { useState } from 'react';
import { Search, Bell, Wifi, WifiOff, ShieldCheck, Flame } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

export function Header() {
  const { isConnected } = useWebSocket();
  const [unreadNotifications] = useState(3);

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
            <span className="font-semibold text-tv-heading">$3,485.20</span>
            <span className="text-tv-green text-[10px]">+2.4%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-tv-muted">BTC:</span>
            <span className="font-semibold text-tv-heading">$67,920.00</span>
            <span className="text-tv-green text-[10px]">+1.8%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-tv-muted">SOL:</span>
            <span className="font-semibold text-tv-heading">$184.50</span>
            <span className="text-tv-red text-[10px]">-0.6%</span>
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
