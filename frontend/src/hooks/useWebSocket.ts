'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface WSMessage {
  type: string;
  data?: any;
  message?: string;
  channels?: string[];
}

export function useWebSocket(url = 'ws://localhost:8080/api/v1/ws') {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Default subscriptions
        ws.send(
          JSON.stringify({
            action: 'subscribe',
            channels: ['transfers:all', 'hyperliquid:all'],
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
          if (parsed.type === 'SUBSCRIBED') {
            setSubscribedChannels(parsed.channels || []);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = (err) => {
        setIsConnected(false);
      };
    } catch (e) {
      setIsConnected(false);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const subscribe = useCallback((channels: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', channels }));
    }
  }, []);

  return { isConnected, lastMessage, subscribedChannels, subscribe };
}
