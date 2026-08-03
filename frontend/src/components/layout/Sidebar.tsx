'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Fish,
  ArrowLeftRight,
  Bell,
  Search,
  Bookmark,
  Settings,
  Trophy,
  Activity,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Wallets', href: '/wallets', icon: Wallet },
  { name: 'Whales', href: '/whales', icon: Fish, badge: 'HYPER' },
  { name: 'Transfers', href: '/transfers', icon: ArrowLeftRight, badge: 'LIVE' },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Watchlists', href: '/watchlists', icon: Bookmark },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Heatmap', href: '/heatmap', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-tv-card border-r border-tv-border flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-tv-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-tv-blue flex items-center justify-center text-white font-bold shadow-lg shadow-tv-blue/30 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-bold text-tv-heading tracking-wide text-base block leading-tight">
              HYPERTRACKER
            </span>
            <span className="text-[10px] text-tv-cyan font-mono tracking-widest uppercase font-semibold">
              Crypto Intelligence
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-tv-muted uppercase tracking-wider">
          Intelligence Suite
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-tv-blue text-white shadow-md shadow-tv-blue/20 font-semibold'
                  : 'text-tv-text hover:bg-tv-hover hover:text-tv-heading'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-tv-muted'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badge === 'LIVE'
                      ? 'bg-tv-green/20 text-tv-green border border-tv-green/30'
                      : 'bg-tv-purple/20 text-tv-purple border border-tv-purple/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Badge */}
      <div className="p-3 border-t border-tv-border bg-tv-bg/50">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-tv-surface border border-tv-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-tv-blue to-tv-purple flex items-center justify-center font-bold text-xs text-white">
            PRO
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-tv-heading truncate">Institutional Pro</p>
            <p className="text-[10px] text-tv-green flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-tv-green animate-pulse" />
              API Connected
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
