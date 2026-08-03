'use client';

import { useState, useEffect } from 'react';
import { Search, Hash, Wallet, Building2, Coins, Fish, ArrowUpRight } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'WALLET' | 'TRANSACTION' | 'TOKEN' | 'EXCHANGE' | 'HYPERLIQUID_TRADER';
  title: string;
  subtitle: string;
  chain?: string;
  badge: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:8080/api/v1/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          const cats = json.data?.categories || {};
          const combined: SearchResult[] = [
            ...(cats.wallets || []),
            ...(cats.transactions || []),
            ...(cats.tokens || []),
            ...(cats.exchanges || []),
            ...(cats.hyperliquidTraders || []),
          ];
          setResults(combined);
        }
      } catch (err) {
        console.error('Failed to fetch search results:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = results.filter((r) => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'WALLETS') return r.type === 'WALLET';
    if (activeCategory === 'TRANSACTIONS') return r.type === 'TRANSACTION';
    if (activeCategory === 'TOKENS') return r.type === 'TOKEN';
    if (activeCategory === 'EXCHANGES') return r.type === 'EXCHANGE';
    if (activeCategory === 'HYPERLIQUID') return r.type === 'HYPERLIQUID_TRADER';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <h1 className="text-2xl font-extrabold text-tv-heading tracking-tight flex items-center justify-center gap-2">
          <Search className="w-6 h-6 text-tv-blue" />
          PostgreSQL Full-Text Search Engine
        </h1>
        <p className="text-xs text-tv-muted">
          Real-time indexing across Wallets, Transactions, Tokens, Exchanges, and Hyperliquid Traders.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-tv-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Wallet (0x...), Tx Hash, Token (ETH, SOL), Exchange (Binance), or Hyperliquid Trader..."
          className="w-full bg-tv-card border-2 border-tv-border rounded-xl pl-12 pr-4 py-3 text-sm text-tv-heading placeholder:text-tv-muted focus:outline-none focus:border-tv-blue shadow-xl transition-all font-mono"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-tv-cyan animate-pulse">
            Searching...
          </div>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-center gap-2 font-mono text-xs flex-wrap">
        {[
          { label: 'All Results', key: 'ALL' },
          { label: 'Wallets', key: 'WALLETS' },
          { label: 'Transactions', key: 'TRANSACTIONS' },
          { label: 'Tokens', key: 'TOKENS' },
          { label: 'Exchanges', key: 'EXCHANGES' },
          { label: 'Hyperliquid Traders', key: 'HYPERLIQUID' },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
              activeCategory === cat.key
                ? 'bg-tv-blue text-white border-tv-blue shadow-md shadow-tv-blue/20'
                : 'bg-tv-card border-tv-border text-tv-muted hover:text-tv-heading'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="space-y-3 pt-2">
        {filteredResults.length > 0 ? (
          filteredResults.map((res, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-tv-card border border-tv-border hover:border-tv-blue transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-tv-surface border border-tv-border flex items-center justify-center text-tv-blue group-hover:scale-105 transition-transform">
                  {res.type === 'WALLET' ? (
                    <Wallet className="w-5 h-5" />
                  ) : res.type === 'TRANSACTION' ? (
                    <Hash className="w-5 h-5 text-tv-green" />
                  ) : res.type === 'TOKEN' ? (
                    <Coins className="w-5 h-5 text-tv-purple" />
                  ) : res.type === 'EXCHANGE' ? (
                    <Building2 className="w-5 h-5 text-tv-gold" />
                  ) : (
                    <Fish className="w-5 h-5 text-tv-cyan" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-tv-heading text-sm group-hover:text-tv-blue transition-colors">
                      {res.title}
                    </h3>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-tv-surface border border-tv-border text-tv-text font-mono">
                      {res.badge}
                    </span>
                    {res.chain && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-tv-blue/20 text-tv-cyan font-mono">
                        {res.chain}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-tv-muted font-mono">{res.subtitle}</p>
                </div>
              </div>

              <ArrowUpRight className="w-4 h-4 text-tv-muted group-hover:text-tv-blue transition-colors" />
            </div>
          ))
        ) : query.trim() ? (
          <div className="text-center py-12 text-tv-muted font-mono text-xs">
            No matching results found for "{query}".
          </div>
        ) : (
          <div className="text-center py-12 text-tv-muted font-mono text-xs">
            Start typing above to search across Wallets, Transactions, Tokens, Exchanges, and Hyperliquid Traders.
          </div>
        )}
      </div>
    </div>
  );
}
