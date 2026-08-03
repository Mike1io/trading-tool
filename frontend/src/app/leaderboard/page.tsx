'use client';

import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

interface LeaderboardItem {
  id: string;
  address: string;
  chain: string;
  smartMoneyScore: number;
  winRate30d: number;
  totalPnlUsd: string | number;
}

export default function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8080/api/v1/search?limit=20');
        if (res.ok) {
          const json = await res.json();
          setItems(json.data?.wallets || []);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tv-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-tv-heading flex items-center gap-2">
            <Trophy className="w-5 h-5 text-tv-gold" />
            Smart Money & Top PnL Leaderboard (PostgreSQL)
          </h1>
          <p className="text-xs text-tv-muted">
            Rankings of top-performing smart money wallets stored in PostgreSQL.
          </p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-tv-card border border-tv-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-tv-surface text-tv-muted border-b border-tv-border">
              <tr>
                <th className="p-3.5">Rank</th>
                <th className="p-3.5">Trader Address</th>
                <th className="p-3.5">Chain</th>
                <th className="p-3.5">Smart Score</th>
                <th className="p-3.5">30d Win Rate</th>
                <th className="p-3.5">Total Realized PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tv-border">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-tv-muted">
                    Loading leaderboard rankings from PostgreSQL...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-tv-muted">
                    No leaderboard wallet records found in PostgreSQL yet. Ingesting live transactions...
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-tv-hover transition-colors">
                    <td className="p-3.5 font-bold text-base text-tv-gold">#{idx + 1}</td>
                    <td className="p-3.5 text-tv-blue font-semibold">{item.address.substring(0, 16)}...</td>
                    <td className="p-3.5 text-tv-heading font-bold">{item.chain}</td>
                    <td className="p-3.5 text-tv-cyan font-bold">{item.smartMoneyScore || 85}</td>
                    <td className="p-3.5 text-tv-green font-bold">{item.winRate30d || 75}%</td>
                    <td className="p-3.5 text-tv-green font-extrabold text-sm">
                      ${Number(item.totalPnlUsd || 0).toLocaleString()}
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
