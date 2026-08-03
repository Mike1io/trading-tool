'use client';

import { useState, useEffect } from 'react';
import { Fish, Zap } from 'lucide-react';

interface HyperPositionItem {
  id: string;
  userAddress: string;
  coin: string;
  side: string;
  leverage: number;
  positionSize: string | number;
  entryPrice: string | number;
  markPrice: string | number;
  liquidationPrice: string | number | null;
  unrealizedPnl: string | number;
  isWhale: boolean;
}

export default function WhalesPage() {
  const [positions, setPositions] = useState<HyperPositionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWhales() {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8080/api/v1/hyperliquid/positions?isWhale=true');
        if (res.ok) {
          const json = await res.json();
          setPositions(json.data?.positions || []);
        }
      } catch (err) {
        console.error('Error fetching Hyperliquid whale positions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWhales();
    const interval = setInterval(fetchWhales, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tv-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-tv-heading flex items-center gap-2">
            <Fish className="w-5 h-5 text-tv-purple" />
            Hyperliquid Whale Position & Liquidation Monitor
          </h1>
          <p className="text-xs text-tv-muted">
            Real-time indexing of whale positions, leverage, liquidation risk meters, and PnL stored in PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-tv-card border border-tv-purple/40 px-3 py-1.5 rounded-lg text-tv-purple font-semibold">
          <Zap className="w-4 h-4" />
          <span>Hyperliquid L1 WebSocket Active</span>
        </div>
      </div>

      {/* Whale Table */}
      <div className="bg-tv-card border border-tv-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-tv-surface text-tv-muted border-b border-tv-border">
              <tr>
                <th className="p-3.5">Trader Address</th>
                <th className="p-3.5">Asset</th>
                <th className="p-3.5">Side / Leverage</th>
                <th className="p-3.5">Position Size (USD)</th>
                <th className="p-3.5">Entry Price</th>
                <th className="p-3.5">Mark Price</th>
                <th className="p-3.5">Liquidation Price</th>
                <th className="p-3.5">Unrealized PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tv-border">
              {loading && positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-tv-muted">
                    Loading live whale positions from PostgreSQL...
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-tv-muted">
                    No whale positions stored in PostgreSQL yet. Listening to Hyperliquid L1 WebSocket stream...
                  </td>
                </tr>
              ) : (
                positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-tv-hover transition-colors">
                    <td className="p-3.5 text-tv-blue font-semibold">{pos.userAddress.substring(0, 14)}...</td>
                    <td className="p-3.5 text-tv-heading font-bold">{pos.coin}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pos.side === 'LONG' ? 'bg-tv-green/20 text-tv-green' : 'bg-tv-red/20 text-tv-red'
                        }`}
                      >
                        {pos.side} {pos.leverage}x
                      </span>
                    </td>
                    <td className="p-3.5 text-tv-heading font-bold">${Number(pos.positionSize).toLocaleString()}</td>
                    <td className="p-3.5 text-tv-text">${Number(pos.entryPrice).toLocaleString()}</td>
                    <td className="p-3.5 text-tv-heading font-semibold">${Number(pos.markPrice).toLocaleString()}</td>
                    <td className="p-3.5 text-tv-red font-semibold">
                      {pos.liquidationPrice ? `$${Number(pos.liquidationPrice).toLocaleString()}` : 'N/A'}
                    </td>
                    <td className={`p-3.5 font-bold ${Number(pos.unrealizedPnl) >= 0 ? 'text-tv-green' : 'text-tv-red'}`}>
                      ${Number(pos.unrealizedPnl).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
