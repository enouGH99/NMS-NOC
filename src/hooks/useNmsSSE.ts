'use client';

/**
 * useNmsSSE — React hook for subscribing to NMS real-time SNMP telemetry
 *
 * Connects to /api/sse/metrics via the browser's native EventSource API.
 * Automatically reconnects with exponential backoff if the connection drops.
 * Pauses the connection when the browser tab is hidden to conserve resources.
 *
 * Usage:
 *   const { sseStatus } = useNmsSSE((payload) => {
 *     // payload is SnmpUpdatePayload from sse-manager.ts
 *     setDevices(payload.devices ?? []);
 *   });
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SnmpUpdatePayload } from '@/lib/sse-manager';

export type SseStatus = 'connecting' | 'connected' | 'reconnecting' | 'error' | 'paused';

interface UseNmsSseOptions {
  /** URL of the SSE endpoint. Defaults to '/api/sse/metrics'. */
  url?: string;
  /** Whether to pause when the browser tab is hidden. Default: true. */
  pauseWhenHidden?: boolean;
  /** Initial reconnect delay in ms. Default: 3000. */
  initialReconnectDelayMs?: number;
  /** Maximum reconnect delay in ms. Default: 30000. */
  maxReconnectDelayMs?: number;
}

interface UseNmsSseReturn {
  /** Current SSE connection status */
  sseStatus: SseStatus;
  /** ISO timestamp of the last received update */
  lastUpdateAt: string | null;
  /** Number of SNMP updates received since mount */
  updateCount: number;
  /** Manually disconnect the SSE stream */
  disconnect: () => void;
  /** Manually reconnect the SSE stream */
  reconnect: () => void;
}

export function useNmsSSE(
  onUpdate: (payload: SnmpUpdatePayload) => void,
  options: UseNmsSseOptions = {}
): UseNmsSseReturn {
  const {
    url = '/api/sse/metrics',
    pauseWhenHidden = true,
    initialReconnectDelayMs = 3000,
    maxReconnectDelayMs = 30000,
  } = options;

  const [sseStatus, setSseStatus] = useState<SseStatus>('connecting');
  const [lastUpdateAt, setLastUpdateAt] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(initialReconnectDelayMs);
  const manualDisconnectRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdate reference stable (avoids effect re-runs)
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Don't connect if manually disconnected
    if (manualDisconnectRef.current) return;

    // Don't create duplicate connections
    if (esRef.current && esRef.current.readyState !== EventSource.CLOSED) {
      esRef.current.close();
    }

    setSseStatus('connecting');

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setSseStatus('connected');
      reconnectDelayRef.current = initialReconnectDelayMs; // Reset backoff on success
      clearReconnectTimer();
    };

    es.onmessage = (event: MessageEvent) => {
      try {
        const payload: SnmpUpdatePayload = JSON.parse(event.data);

        // Ignore initial connection acknowledgment and heartbeats
        if (payload.type === 'heartbeat' || (payload as any).type === 'connected') return;

        if (payload.type === 'snmp_update') {
          onUpdateRef.current(payload);
          setLastUpdateAt(payload.timestamp);
          setUpdateCount(prev => prev + 1);
        }
      } catch {
        // Malformed JSON — ignore
      }
    };

    es.onerror = () => {
      if (manualDisconnectRef.current) return;

      setSseStatus('reconnecting');
      es.close();
      esRef.current = null;

      // Exponential backoff: 3s → 6s → 12s → ... → 30s max
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, maxReconnectDelayMs);

      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  }, [url, initialReconnectDelayMs, maxReconnectDelayMs, clearReconnectTimer]);

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    clearReconnectTimer();
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setSseStatus('paused');
  }, [clearReconnectTimer]);

  const reconnect = useCallback(() => {
    manualDisconnectRef.current = false;
    reconnectDelayRef.current = initialReconnectDelayMs;
    clearReconnectTimer();
    connect();
  }, [connect, clearReconnectTimer, initialReconnectDelayMs]);

  // Initial connection on mount
  useEffect(() => {
    manualDisconnectRef.current = false;
    connect();

    return () => {
      // Cleanup on unmount
      manualDisconnectRef.current = true;
      clearReconnectTimer();
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Re-connect only if URL changes

  // Pause/resume SSE based on browser tab visibility
  useEffect(() => {
    if (!pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab is hidden — pause to save resources
        if (esRef.current && !manualDisconnectRef.current) {
          esRef.current.close();
          esRef.current = null;
          setSseStatus('paused');
          clearReconnectTimer();
        }
      } else if (document.visibilityState === 'visible') {
        // Tab is visible again — reconnect immediately
        if (!manualDisconnectRef.current) {
          reconnectDelayRef.current = initialReconnectDelayMs;
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pauseWhenHidden, connect, clearReconnectTimer, initialReconnectDelayMs]);

  return { sseStatus, lastUpdateAt, updateCount, disconnect, reconnect };
}
