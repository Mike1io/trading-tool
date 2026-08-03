'use client';

import { Activity, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const HEATMAP_SECTORS = [
  { symbol: 'ETH', name: 'Ethereum', volume: '$184.2M', netflow: '+$42.5M', size: 'col-span-2 row-span-2', bg: 'bg-tv-green/20 border-tv-green/40 text-tv-green' },
  { symbol: 'SOL', name: 'Solana', volume: '$92.4M', netflow: '+$18.2M', size: 'col-span-1 row-span-2', bg: 'bg-tv-green/20 border-tv-green/40 text-tv-green' },
  { symbol: 'BTC', name: 'Bitcoin', volume: '$128.5M', netflow: '-$12.4M', size: 'col-span-2 row-span-1', bg: 'bg-tv-red/20 border-tv-red/40 text-tv-red' },
  { symbol: 'ARB', name: 'Arbitrum', volume: '$45.1M', netflow: '+$8.9M', size: 'col-span-1 row-span-1', bg: 'bg-tv-green/20 border-tv-green/40 text-tv-green' },
  { symbol: 'BASE', name: 'Base Network', volume: '$32.8M', netflow: '+$5.4M', size: 'col-span-1 row-span-1', bg: 'bg-tv-green/20 border-tv-green/40 text-tv-green' },
];

export default function HeatmapPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tv-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-tv-heading flex items-center gap-2">
            <Activity className="w-5 h-5 text-tv-red" />
            Crypto Transfer & Exchange Netflow Heatmap
          </h1>
          <p className="text-xs text-tv-muted">
            Visual matrix representing token transfer volume, net CEX accumulation, and capital flows.
          </p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-4 gap-4 auto-rows-[140px]">
        {HEATMAP_SECTORS.map((sector) => (
          <div
            key={sector.symbol}
            className={`${sector.size} ${sector.bg} border rounded-xl p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform cursor-pointer shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-lg text-tv-heading block leading-tight">{sector.symbol}</span>
                <span className="text-xs text-tv-muted">{sector.name}</span>
              </div>
              <span className="text-xs font-mono font-bold">{sector.netflow}</span>
            </div>

            <div className="flex items-center justify-between font-mono text-xs border-t border-white/10 pt-3">
              <span className="text-tv-muted">24h Transfer Vol:</span>
              <span className="font-bold text-tv-heading">{sector.volume}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
