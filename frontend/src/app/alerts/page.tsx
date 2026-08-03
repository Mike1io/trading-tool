'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface AlertItem {
  id: string;
  name: string;
  eventType: string;
  minAmountUsd: string | number;
  channels: string[];
  isActive: boolean;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [ruleName, setRuleName] = useState('');
  const [threshold, setThreshold] = useState('1000000');
  const [eventType, setEventType] = useState('TRANSFER');
  const [selectedChannels, setSelectedChannels] = useState(['TELEGRAM', 'DISCORD']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8080/api/v1/alerts');
        if (res.ok) {
          const json = await res.json();
          setAlerts(json.data?.alerts || []);
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tv-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-tv-heading flex items-center gap-2">
            <Bell className="w-5 h-5 text-tv-gold" />
            Alert Rule Engine & Multi-Channel Dispatcher (PostgreSQL)
          </h1>
          <p className="text-xs text-tv-muted">
            Configure automated alerts stored in PostgreSQL and dispatched across Telegram, Discord, and WebSockets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule Builder Panel (1 Column) */}
        <div className="bg-tv-card border border-tv-border p-5 rounded-xl space-y-4">
          <h2 className="text-base font-bold text-tv-heading flex items-center gap-2">
            <Plus className="w-4 h-4 text-tv-blue" />
            Create Alert Rule
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-tv-muted mb-1 font-semibold">Rule Name</label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. Whale Transfer > $1M"
                className="w-full bg-tv-bg border border-tv-border rounded-lg px-3 py-2 text-tv-heading focus:outline-none focus:border-tv-blue"
              />
            </div>

            <div>
              <label className="block text-tv-muted mb-1 font-semibold">Event Trigger Category</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-tv-bg border border-tv-border rounded-lg px-3 py-2 text-tv-heading focus:outline-none"
              >
                <option value="TRANSFER">Large On-Chain Transfer</option>
                <option value="EXCHANGE_DEPOSIT">Exchange Deposit</option>
                <option value="EXCHANGE_WITHDRAWAL">Exchange Withdrawal</option>
                <option value="HYPER_POSITION">Hyperliquid Whale Position</option>
              </select>
            </div>

            <div>
              <label className="block text-tv-muted mb-1 font-semibold">USD Threshold Trigger</label>
              <select
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full bg-tv-bg border border-tv-border rounded-lg px-3 py-2 text-tv-heading font-mono focus:outline-none"
              >
                <option value="100000">$100,000 USD</option>
                <option value="500000">$500,000 USD</option>
                <option value="1000000">$1,000,000 USD ($1M)</option>
                <option value="5000000">$5,000,000 USD ($5M)</option>
                <option value="10000000">$10,000,000 USD ($10M)</option>
              </select>
            </div>

            <div>
              <label className="block text-tv-muted mb-2 font-semibold">Dispatch Channels</label>
              <div className="grid grid-cols-2 gap-2 font-mono">
                {['TELEGRAM', 'DISCORD', 'EMAIL', 'WEB_PUSH', 'MOBILE_PUSH'].map((ch) => {
                  const isChecked = selectedChannels.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`p-2 rounded-lg text-[10px] font-bold border transition-all text-left flex items-center justify-between ${
                        isChecked
                          ? 'bg-tv-blue/20 border-tv-blue text-tv-cyan'
                          : 'bg-tv-surface border-tv-border text-tv-muted'
                      }`}
                    >
                      <span>{ch}</span>
                      {isChecked && <CheckCircle2 className="w-3 h-3 text-tv-cyan" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button className="w-full mt-4 bg-tv-blue hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-tv-blue/20 transition-all">
              <Sparkles className="w-4 h-4" />
              Save Alert Rule
            </button>
          </div>
        </div>

        {/* Active Rules List (2 Columns) */}
        <div className="lg:col-span-2 bg-tv-card border border-tv-border p-5 rounded-xl space-y-4">
          <h2 className="text-base font-bold text-tv-heading flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-tv-gold" />
            Configured Alert Rules
          </h2>

          <div className="space-y-3">
            {loading && alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-tv-muted">
                Loading alerts from PostgreSQL...
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-tv-muted">
                No alert rules configured in PostgreSQL yet. Create an alert rule using the panel on the left.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl bg-tv-surface border border-tv-border flex items-center justify-between hover:border-tv-gold/50 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-tv-heading text-sm">{alert.name}</span>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                          alert.isActive
                            ? 'bg-tv-green/20 text-tv-green border border-tv-green/30'
                            : 'bg-tv-muted/20 text-tv-muted'
                        }`}
                      >
                        {alert.isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <div className="text-xs text-tv-muted flex items-center gap-3 font-mono">
                      <span>
                        Threshold: <strong className="text-tv-heading">${Number(alert.minAmountUsd).toLocaleString()}</strong>
                      </span>
                      <span>
                        Event: <strong className="text-tv-cyan">{alert.eventType}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      {(alert.channels || []).map((ch) => (
                        <span
                          key={ch}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-tv-card border border-tv-border text-tv-text"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
