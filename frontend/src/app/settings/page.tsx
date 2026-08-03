'use client';

import { useState } from 'react';
import { Settings, Key, Send, Bell, Save, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [telegramChatId, setTelegramChatId] = useState('123456789');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('https://discord.com/api/webhooks/...');
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-tv-border pb-4">
        <h1 className="text-xl font-bold text-tv-heading flex items-center gap-2">
          <Settings className="w-5 h-5 text-tv-blue" />
          Settings & Developer API Access
        </h1>
        <p className="text-xs text-tv-muted">
          Manage Webhook URLs, Telegram Chat integration, notification preferences, and API Keys.
        </p>
      </div>

      {/* Webhook & Notification Settings */}
      <div className="bg-tv-card border border-tv-border p-5 rounded-xl space-y-4">
        <h2 className="text-base font-bold text-tv-heading flex items-center gap-2">
          <Bell className="w-4 h-4 text-tv-gold" />
          Notification Integration Webhooks
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-tv-muted mb-1 font-semibold">Telegram Chat ID</label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="e.g. 987654321"
              className="w-full bg-tv-bg border border-tv-border rounded-lg px-3 py-2 text-tv-heading font-mono focus:outline-none focus:border-tv-blue"
            />
          </div>

          <div>
            <label className="block text-tv-muted mb-1 font-semibold">Discord Webhook URL</label>
            <input
              type="text"
              value={discordWebhookUrl}
              onChange={(e) => setDiscordWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-tv-bg border border-tv-border rounded-lg px-3 py-2 text-tv-heading font-mono focus:outline-none focus:border-tv-blue"
            />
          </div>

          <div className="flex items-center justify-between border-t border-tv-border pt-3">
            <div>
              <span className="font-semibold text-tv-heading block">Email Notifications</span>
              <span className="text-[11px] text-tv-muted">Receive major market movement digests in email inbox.</span>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 text-tv-blue bg-tv-bg border-tv-border rounded focus:ring-0"
            />
          </div>

          <button className="bg-tv-blue hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-md shadow-tv-blue/20">
            <Save className="w-4 h-4" /> Save Integrations
          </button>
        </div>
      </div>

      {/* Developer API Key Generator */}
      <div className="bg-tv-card border border-tv-border p-5 rounded-xl space-y-4">
        <h2 className="text-base font-bold text-tv-heading flex items-center gap-2">
          <Key className="w-4 h-4 text-tv-purple" />
          Developer API Keys
        </h2>

        <div className="p-3 rounded-lg bg-tv-surface border border-tv-border flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-tv-muted block text-[10px]">PRODUCTION KEY (RPM: 600)</span>
            <span className="text-tv-cyan font-bold">ht_live_8f31c285a29c294119932...</span>
          </div>
          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-tv-green/20 text-tv-green border border-tv-green/30">
            ACTIVE
          </span>
        </div>

        <button className="bg-tv-surface hover:bg-tv-hover border border-tv-border text-tv-heading font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-tv-purple" /> Generate New API Key
        </button>
      </div>
    </div>
  );
}
