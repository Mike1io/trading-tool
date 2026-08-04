'use client';

import { useState, useEffect } from 'react';
import { Fish, Zap, ShieldCheck } from 'lucide-react';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tv-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-tv-heading flex items-center gap-2">
            <Fish className="w-5 h-5 text-tv-purple" />
            Hyperliquid Whale Accounts & Position Monitor
          </h1>
          <p className="text-xs text-tv-muted">
            Strictly classified whale accounts (Position $\ge \$250\text{k}$, Vol $\ge \$5\text{M}$, PnL $\ge \$1\text{M}$). Retail trades under $\$50\text{k}$ are ignored.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-tv-card border border-tv-purple/40 px-3 py-1.5 rounded-lg text-tv-purple font-semibold">
          <Zap className="w-4 h-4" />
          <span>Hyperliquid Whale Stream Active</span>
        </div>
      </div>

      {/* Qualification Threshold Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-tv-card border border-tv-border p-3.5 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-tv-gold" />
          <div>
            <span className="text-tv-muted block text-[10px]">THRESOLD 1</span>
            <span className="font-bold text-tv-heading text-xs">Position $\ge \$250,000$ USD</span>
          </div>
        </div>
        <div className="bg-tv-card border border-tv-border p-3.5 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-tv-cyan" />
          <div>
            <span className="text-tv-muted block text-[10px]">THRESOLD 2</span>
            <span className="font-bold text-tv-heading text-xs">Cumulative Volume $\ge \$5,000,000$</span>
          </div>
        </div>
        <div className="bg-tv-card border border-tv-border p-3.5 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-tv-green" />
          <div>
            <span className="text-tv-muted block text-[10px]">THRESOLD 3</span>
            <span className="font-bold text-tv-heading text-xs">Realized PnL $\ge \$1,000,000$</span>
          </div>
        </div>
      </div>

      {/* Whale Table */}
      <div className="bg-tv-card border border-tv-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-tv-surface text-tv-muted border-b border-tv-border">
              <tr>
                <th className="p-3.5">Whale Trader Address</th>
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
                    Loading qualified whale positions from PostgreSQL...
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-tv-muted">
                    No qualified whale positions stored in PostgreSQL hyper_whales yet. Streaming Hyperliquid L1...
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
