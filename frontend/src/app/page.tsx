'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Activity,
  Zap,
  TrendingUp,
  ShieldAlert,
  ArrowLeftRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TransferItem {
  id: string;
  chain: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  tokenSymbol: string;
  amountUsd: string | number;
  flowType: string;
  blockTimestamp: string;
}

interface HyperPositionItem {
  id: string;
  userAddress: string;
  coin: string;
  side: string;
  leverage: number;
  positionSize: string | number;
  unrealizedPnl: string | number;
  isWhale: boolean;
}

export default function DashboardPage() {
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [hyperPositions, setHyperPositions] = useState<HyperPositionItem[]>([]);
  const [stats, setStats] = useState({
    totalVolumeUsd: 0,
    netExchangeOutflow: 0,
    hyperWhaleOi: 0,
    alertCount: 0,
  });

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [transfersRes, statsRes, hyperRes] = await Promise.allSettled([
          fetch('http://localhost:8080/api/v1/transfers?limit=10'),
          fetch('http://localhost:8080/api/v1/transfers/stats'),
          fetch('http://localhost:8080/api/v1/hyperliquid/positions?isWhale=true'),
        ]);

        if (transfersRes.status === 'fulfilled' && transfersRes.value.ok) {
          const json = await transfersRes.value.json();
          setTransfers(json.data?.transfers || []);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const json = await statsRes.value.json();
          const d = json.data || {};
          setStats({
            totalVolumeUsd: d.totalVolumeUsd || 0,
            netExchangeOutflow: (d.exchangeWithdrawals || 0) - (d.exchangeDeposits || 0),
            hyperWhaleOi: d.largeTransfers || 0,
            alertCount: d.totalTransfers || 0,
          });
        }

        if (hyperRes.status === 'fulfilled' && hyperRes.value.ok) {
          const json = await hyperRes.value.json();
          setHyperPositions(json.data?.positions || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard live data:', err);
      }
    }

    loadLiveData();
    const interval = setInterval(loadLiveData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-tv-card border border-tv-border p-4 rounded-xl space-y-2 relative overflow-hidden group hover:border-tv-blue transition-colors">
          <div className="flex items-center justify-between text-tv-muted text-xs">
            <span>24h Transfer Volume</span>
            <ArrowLeftRight className="w-4 h-4 text-tv-blue" />
          </div>
          <div className="text-2xl font-bold font-mono text-tv-heading">
            ${Number(stats.totalVolumeUsd).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-tv-green font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Live Blockchain Streams</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-tv-card border border-tv-border p-4 rounded-xl space-y-2 relative overflow-hidden group hover:border-tv-green transition-colors">
          <div className="flex items-center justify-between text-tv-muted text-xs">
            <span>Net CEX Exchange Netflow</span>
            <TrendingUp className="w-4 h-4 text-tv-green" />
          </div>
          <div className="text-2xl font-bold font-mono text-tv-green">
            {stats.netExchangeOutflow >= 0 ? `+$${stats.netExchangeOutflow}` : `-$${Math.abs(stats.netExchangeOutflow)}`}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-tv-green font-medium">
            <span className="w-2 h-2 rounded-full bg-tv-green animate-pulse" />
            <span>Real Exchange Labels</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-tv-card border border-tv-border p-4 rounded-xl space-y-2 relative overflow-hidden group hover:border-tv-purple transition-colors">
          <div className="flex items-center justify-between text-tv-muted text-xs">
            <span>Hyperliquid Active Positions</span>
            <Zap className="w-4 h-4 text-tv-purple" />
          </div>
          <div className="text-2xl font-bold font-mono text-tv-heading">
            {hyperPositions.length} Whale Active
          </div>
          <div className="flex items-center gap-1.5 text-xs text-tv-purple font-medium">
            <span>Official Hyperliquid L1 WS</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-tv-card border border-tv-border p-4 rounded-xl space-y-2 relative overflow-hidden group hover:border-tv-gold transition-colors">
          <div className="flex items-center justify-between text-tv-muted text-xs">
            <span>Live Blockchain Events</span>
            <ShieldAlert className="w-4 h-4 text-tv-gold" />
          </div>
          <div className="text-2xl font-bold font-mono text-tv-heading">
            {stats.alertCount} Events
          </div>
          <div className="flex items-center gap-1.5 text-xs text-tv-muted font-medium">
            <span>Last 24 hours</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Live Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Netflows Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-tv-card border border-tv-border p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-tv-heading flex items-center gap-2">
                <Activity className="w-4 h-4 text-tv-cyan" />
                Live Ingested Volume Stream
              </h2>
              <p className="text-xs text-tv-muted">Transfers ingested from multi-chain RPCs into PostgreSQL</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center bg-tv-surface rounded-lg border border-tv-border">
            {transfers.length === 0 ? (
              <p className="text-xs text-tv-muted">Waiting for incoming live RPC transactions to populate stream chart...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transfers.slice(0, 10)}>
                  <XAxis dataKey="tokenSymbol" stroke="#8b949e" fontSize={11} />
                  <YAxis stroke="#8b949e" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#f0f6fc' }}
                  />
                  <Bar dataKey="amountUsd" fill="#089981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Hyperliquid Whale Monitor Summary */}
        <div className="bg-tv-card border border-tv-border p-5 rounded-xl space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-tv-border pb-3">
            <h2 className="text-base font-bold text-tv-heading flex items-center gap-2">
              <Zap className="w-4 h-4 text-tv-purple" />
              Hyperliquid Live Positions
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-tv-purple/20 text-tv-purple border border-tv-purple/30">
              REALTIME WS
            </span>
          </div>

          <div className="flex-1 space-y-3">
            {hyperPositions.length === 0 ? (
              <div className="p-4 text-center text-xs text-tv-muted">
                Listening to official Hyperliquid L1 WebSocket for position fills...
              </div>
            ) : (
              hyperPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="p-3 rounded-lg bg-tv-surface border border-tv-border hover:border-tv-purple/50 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-tv-heading">{pos.userAddress.substring(0, 10)}...</span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        pos.side === 'LONG' ? 'bg-tv-green/20 text-tv-green' : 'bg-tv-red/20 text-tv-red'
                      }`}
                    >
                      {pos.side} {pos.leverage}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-tv-muted">Coin / Size:</span>
                    <span className="text-tv-heading font-semibold">{pos.coin} (${Number(pos.positionSize).toLocaleString()})</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-tv-muted">Unrealized PnL:</span>
                    <span className={Number(pos.unrealizedPnl) >= 0 ? 'text-tv-green font-bold' : 'text-tv-red font-bold'}>
                      ${Number(pos.unrealizedPnl).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Transfers Feed Table */}
      <div className="bg-tv-card border border-tv-border p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-tv-heading flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-tv-blue" />
              Live Blockchain Transfer Stream (PostgreSQL)
            </h2>
            <p className="text-xs text-tv-muted">Real-time multi-chain transfers & exchange flows</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-tv-surface text-tv-muted border-b border-tv-border">
              <tr>
                <th className="p-3">Chain</th>
                <th className="p-3">Transaction Hash</th>
                <th className="p-3">From Address</th>
                <th className="p-3">To Address</th>
                <th className="p-3">Token</th>
                <th className="p-3">USD Value</th>
                <th className="p-3">Flow Type</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tv-border">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-tv-muted">
                    No active transfers recorded yet. Waiting for live RPC block events...
                  </td>
                </tr>
              ) : (
                transfers.map((tx) => (
                  <tr key={tx.id} className="hover:bg-tv-hover transition-colors">
                    <td className="p-3 font-bold text-tv-heading">{tx.chain}</td>
                    <td className="p-3 text-tv-blue">{tx.txHash.substring(0, 14)}...</td>
                    <td className="p-3 text-tv-text">{tx.fromAddress.substring(0, 12)}...</td>
                    <td className="p-3 text-tv-text">{tx.toAddress.substring(0, 12)}...</td>
                    <td className="p-3 text-tv-heading font-semibold">{tx.tokenSymbol}</td>
                    <td className="p-3 font-bold text-tv-green">${Number(tx.amountUsd).toLocaleString()}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.flowType === 'EXCHANGE_WITHDRAWAL'
                            ? 'bg-tv-green/20 text-tv-green'
                            : tx.flowType === 'EXCHANGE_DEPOSIT'
                            ? 'bg-tv-red/20 text-tv-red'
                            : 'bg-tv-blue/20 text-tv-blue'
                        }`}
                      >
                        {tx.flowType}
                      </span>
                    </td>
                    <td className="p-3 text-tv-muted">{new Date(tx.blockTimestamp).toLocaleTimeString()}</td>
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
