'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';

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

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [selectedChain, setSelectedChain] = useState('ALL');
  const [selectedFlow, setSelectedFlow] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransfers() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (selectedChain !== 'ALL') queryParams.append('chain', selectedChain);
        if (selectedFlow !== 'ALL') queryParams.append('flowType', selectedFlow);

        const res = await fetch(`http://localhost:8080/api/v1/transfers?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setTransfers(json.data?.transfers || []);
        }
      } catch (err) {
        console.error('Error fetching live transfers:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransfers();
    const interval = setInterval(fetchTransfers, 5000);
    return () => clearInterval(interval);
  }, [selectedChain, selectedFlow]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tv-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-tv-heading flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-tv-green" />
            Multi-Chain Real-Time Transfer Stream
          </h1>
          <p className="text-xs text-tv-muted">
            Live transfer tracking across Ethereum, Base, Arbitrum, BSC, Solana, Bitcoin, and Tron.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-3">
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="bg-tv-card border border-tv-border text-xs text-tv-heading rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Chains</option>
            <option value="ETHEREUM">Ethereum</option>
            <option value="SOLANA">Solana</option>
            <option value="BITCOIN">Bitcoin</option>
            <option value="TRON">Tron</option>
            <option value="ARBITRUM">Arbitrum</option>
            <option value="BASE">Base</option>
            <option value="BSC">BNB Chain</option>
          </select>

          <select
            value={selectedFlow}
            onChange={(e) => setSelectedFlow(e.target.value)}
            className="bg-tv-card border border-tv-border text-xs text-tv-heading rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Flow Types</option>
            <option value="EXCHANGE_DEPOSIT">Exchange Deposit</option>
            <option value="EXCHANGE_WITHDRAWAL">Exchange Withdrawal</option>
            <option value="WALLET_TO_WALLET">Wallet to Wallet</option>
          </select>
        </div>
      </div>

      {/* Transfer Stream Table */}
      <div className="bg-tv-card border border-tv-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-tv-surface text-tv-muted border-b border-tv-border">
              <tr>
                <th className="p-3.5">Chain</th>
                <th className="p-3.5">Tx Hash</th>
                <th className="p-3.5">From Address</th>
                <th className="p-3.5">To Address</th>
                <th className="p-3.5">Token</th>
                <th className="p-3.5">USD Value</th>
                <th className="p-3.5">Flow Type</th>
                <th className="p-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tv-border">
              {loading && transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-tv-muted">
                    Loading live blockchain transfers from PostgreSQL...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-tv-muted">
                    No active transfers recorded yet. Waiting for live RPC block events...
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-tv-hover transition-colors">
                    <td className="p-3.5 text-tv-heading font-bold">{t.chain}</td>
                    <td className="p-3.5 text-tv-blue font-semibold">{t.txHash.substring(0, 14)}...</td>
                    <td className="p-3.5 text-tv-text">{t.fromAddress.substring(0, 12)}...</td>
                    <td className="p-3.5 text-tv-text">{t.toAddress.substring(0, 12)}...</td>
                    <td className="p-3.5 text-tv-heading font-bold">{t.tokenSymbol}</td>
                    <td className="p-3.5 font-bold text-tv-green">
                      ${Number(t.amountUsd).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.flowType === 'EXCHANGE_WITHDRAWAL'
                            ? 'bg-tv-green/20 text-tv-green border border-tv-green/30'
                            : t.flowType === 'EXCHANGE_DEPOSIT'
                            ? 'bg-tv-red/20 text-tv-red border border-tv-red/30'
                            : 'bg-tv-blue/20 text-tv-blue border border-tv-blue/30'
                        }`}
                      >
                        {t.flowType}
                      </span>
                    </td>
                    <td className="p-3.5 text-tv-muted">
                      {new Date(t.blockTimestamp).toLocaleTimeString()}
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
