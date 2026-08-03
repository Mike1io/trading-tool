'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Plus } from 'lucide-react';

interface WatchlistItem {
  id: string;
  name: string;
  walletAddress: string;
  chain: string;
}

export default function WatchlistsPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newChain, setNewChain] = useState('ETHEREUM');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWatchlists() {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8080/api/v1/watchlists');
        if (res.ok) {
          const json = await res.json();
          setItems(json.data?.watchlists || []);
        }
      } catch (err) {
        console.error('Error fetching watchlists:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWatchlists();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tv-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-tv-heading flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-tv-cyan" />
            Watchlists & Custom Address Tracker (PostgreSQL)
          </h1>
          <p className="text-xs text-tv-muted">
            Monitor transactions, balance updates, and events for your saved wallet addresses stored in PostgreSQL.
          </p>
        </div>

        {/* Add Address Form */}
        <div className="flex items-center gap-2">
          <select
            value={newChain}
            onChange={(e) => setNewChain(e.target.value)}
            className="bg-tv-card border border-tv-border rounded-lg px-2.5 py-1.5 text-xs text-tv-heading focus:outline-none"
          >
            <option value="ETHEREUM">Ethereum</option>
            <option value="SOLANA">Solana</option>
            <option value="BITCOIN">Bitcoin</option>
            <option value="TRON">Tron</option>
            <option value="BASE">Base</option>
            <option value="ARBITRUM">Arbitrum</option>
            <option value="BSC">BNB Chain</option>
          </select>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Add wallet address..."
            className="bg-tv-card border border-tv-border rounded-lg px-3 py-1.5 text-xs text-tv-heading focus:outline-none focus:border-tv-blue"
          />
          <button className="bg-tv-blue hover:bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-tv-blue/20">
            <Plus className="w-3.5 h-3.5" /> Track Address
          </button>
        </div>
      </div>

      {/* Watchlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && items.length === 0 ? (
          <div className="col-span-2 p-6 text-center text-xs text-tv-muted">
            Loading watchlists from PostgreSQL...
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-2 p-6 text-center text-xs text-tv-muted">
            No saved watchlists found in PostgreSQL. Add an address using the toolbar above.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-tv-card border border-tv-border p-5 rounded-xl space-y-3 hover:border-tv-cyan/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-tv-surface border border-tv-border text-tv-cyan font-mono">
                    {item.chain}
                  </span>
                  <h3 className="font-bold text-tv-heading text-base pt-1">{item.name}</h3>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-tv-surface border border-tv-border text-xs font-mono">
                <span className="text-tv-muted block">Tracked Address:</span>
                <span className="text-tv-blue font-semibold">{item.walletAddress}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
