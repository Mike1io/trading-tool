'use client';

import { useState, useEffect } from 'react';
import { Search, Bot, Award, ShieldCheck, Sparkles } from 'lucide-react';

interface WalletItem {
  id: string;
  address: string;
  chain: string;
  isSmartMoney: boolean;
  smartMoneyScore: number;
  winRate30d: number;
  totalPnlUsd: string | number;
  lastActiveAt: string;
}

export default function WalletsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWallets() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/api/v1/search?q=${searchTerm}`);
        if (res.ok) {
          const json = await res.json();
          const items = json.data?.wallets || [];
          setWallets(items);
          if (items.length > 0 && !selectedWallet) {
            setSelectedWallet(items[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching wallets from PostgreSQL:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWallets();
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tv-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-tv-heading flex items-center gap-2">
            <Bot className="w-5 h-5 text-tv-cyan animate-pulse" />
            AI Wallet Intelligence & Directory (PostgreSQL)
          </h1>
          <p className="text-xs text-tv-muted">
            Live indexed wallets, Smart Money Scores, and multi-chain activity stored in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-tv-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter address or label..."
              className="bg-tv-card border border-tv-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-tv-heading placeholder:text-tv-muted focus:outline-none focus:border-tv-blue"
            />
          </div>
        </div>
      </div>

      {/* AI Wallet Report Showcase Panel */}
      {selectedWallet && (
        <div className="bg-tv-card border-2 border-tv-cyan/40 p-6 rounded-xl space-y-4 shadow-xl shadow-tv-cyan/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-tv-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-tv-heading">
                  {selectedWallet.address.substring(0, 16)}...
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-tv-cyan/20 text-tv-cyan border border-tv-cyan/30 font-mono">
                  {selectedWallet.chain}
                </span>
                {selectedWallet.isSmartMoney && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-tv-gold/20 text-tv-gold border border-tv-gold/30 font-mono flex items-center gap-1">
                    <Award className="w-3 h-3" /> SMART MONEY
                  </span>
                )}
              </div>
              <p className="text-xs text-tv-muted font-mono pt-1">{selectedWallet.address}</p>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="text-right">
                <span className="text-tv-muted block">Smart Score</span>
                <span className="text-tv-cyan font-extrabold text-base">{selectedWallet.smartMoneyScore || 85} / 100</span>
              </div>
              <div className="text-right">
                <span className="text-tv-muted block">30d Win Rate</span>
                <span className="text-tv-green font-extrabold text-base">{selectedWallet.winRate30d || 75}%</span>
              </div>
              <div className="text-right">
                <span className="text-tv-muted block">Total PnL</span>
                <span className="text-tv-green font-extrabold text-base">
                  ${Number(selectedWallet.totalPnlUsd || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Directory Table */}
      <div className="bg-tv-card border border-tv-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-tv-surface text-tv-muted border-b border-tv-border">
              <tr>
                <th className="p-3.5">Address</th>
                <th className="p-3.5">Chain</th>
                <th className="p-3.5">Smart Score</th>
                <th className="p-3.5">30d Win Rate</th>
                <th className="p-3.5">Total PnL</th>
                <th className="p-3.5">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tv-border">
              {loading && wallets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-tv-muted">
                    Loading wallets from PostgreSQL...
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-tv-muted">
                    No wallet records found in PostgreSQL yet. Ingesting live RPC transactions...
                  </td>
                </tr>
              ) : (
                wallets.map((w) => (
                  <tr
                    key={w.id}
                    onClick={() => setSelectedWallet(w)}
                    className={`hover:bg-tv-hover transition-colors cursor-pointer ${
                      selectedWallet?.address === w.address ? 'bg-tv-surface border-l-4 border-tv-blue' : ''
                    }`}
                  >
                    <td className="p-3.5 text-tv-blue font-semibold">{w.address.substring(0, 14)}...</td>
                    <td className="p-3.5 text-tv-heading font-bold">{w.chain}</td>
                    <td className="p-3.5 font-bold text-tv-cyan">{w.smartMoneyScore || 80} / 100</td>
                    <td className="p-3.5 text-tv-green font-bold">{w.winRate30d || 70}%</td>
                    <td className="p-3.5 text-tv-green font-bold">${Number(w.totalPnlUsd || 0).toLocaleString()}</td>
                    <td className="p-3.5 text-tv-muted">
                      {w.lastActiveAt ? new Date(w.lastActiveAt).toLocaleTimeString() : 'Recent'}
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
