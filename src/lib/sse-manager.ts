/**
 * SSE Broadcaster Singleton — NMS NOC Real-Time Push
 *
 * Manages all active Server-Sent Events client connections.
 * When the SNMP worker finishes a poll cycle, it calls broadcast()
 * to instantly push fresh data to every connected browser tab.
 */

export interface SnmpUpdatePayload {
  type: 'snmp_update' | 'heartbeat';
  timestamp: string;
  devicesPolled?: number;
  devices?: Array<{
    id: string;
    status: string;
    cpu_usage: number;
    ram_usage: number;
    storage_usage: number;
    temperature: number;
    voltage?: number;
    latency: number;
    uptime: string;
    last_seen: string;
  }>;
  interfaces?: Array<{
    id: string;
    device_id: string;
    name: string;
    status: string;
    rx_rate: number;
    tx_rate: number;
    rx_bytes: number;
    tx_bytes: number;
    error_rate: number;
  }>;
  queues?: Array<{
    id: string;
    device_id: string;
    name: string;
    current_rate: { download: number; upload: number };
    dropped: number;
    bytes?: number;
    packets?: number;
  }>;
  vpnTunnels?: Array<{
    id: string;
    device_id: string;
    name: string;
    status: string;
    bytes_in: number;
    bytes_out: number;
    uptime: string;
  }>;
  throughput?: {
    inboundMbps: number;
    outboundMbps: number;
    wanInboundMbps: number;
    wanOutboundMbps: number;
  };
  stats?: {
    totalDevices: number;
    onlineCount: number;
    offlineCount: number;
    warningCount: number;
    slaPercent: number;
    activeAlertsCount: number;
  };
}

class SseBroadcaster {
  private clients = new Set<ReadableStreamDefaultController<string>>();
  private totalBroadcasts = 0;
  private lastBroadcastAt: Date | null = null;

  /**
   * Register a new SSE client connection controller.
   */
  addClient(ctrl: ReadableStreamDefaultController<string>) {
    this.clients.add(ctrl);
    console.log(`📡 [SSE] Client connected. Active connections: ${this.clients.size}`);
  }

  /**
   * Remove a disconnected SSE client controller.
   */
  removeClient(ctrl: ReadableStreamDefaultController<string>) {
    this.clients.delete(ctrl);
    console.log(`📡 [SSE] Client disconnected. Active connections: ${this.clients.size}`);
  }

  /**
   * Broadcast a payload to all connected SSE clients.
   * Automatically removes stale/errored connections.
   */
  broadcast(payload: SnmpUpdatePayload) {
    if (this.clients.size === 0) return;

    const message = `data: ${JSON.stringify(payload)}\n\n`;
    const staleClients: ReadableStreamDefaultController<string>[] = [];

    for (const ctrl of this.clients) {
      try {
        ctrl.enqueue(message);
      } catch {
        // Controller is closed/errored — mark for cleanup
        staleClients.push(ctrl);
      }
    }

    // Clean up stale connections
    for (const stale of staleClients) {
      this.clients.delete(stale);
    }

    this.totalBroadcasts++;
    this.lastBroadcastAt = new Date();
  }

  /**
   * Send a keepalive comment to prevent proxy timeouts.
   * SSE comment lines starting with ':' are ignored by the browser.
   */
  sendHeartbeat() {
    const heartbeat = `: heartbeat ${new Date().toISOString()}\n\n`;
    const staleClients: ReadableStreamDefaultController<string>[] = [];

    for (const ctrl of this.clients) {
      try {
        ctrl.enqueue(heartbeat);
      } catch {
        staleClients.push(ctrl);
      }
    }

    for (const stale of staleClients) {
      this.clients.delete(stale);
    }
  }

  get clientCount() {
    return this.clients.size;
  }

  get status() {
    return {
      activeClients: this.clients.size,
      totalBroadcasts: this.totalBroadcasts,
      lastBroadcastAt: this.lastBroadcastAt?.toISOString() ?? null,
    };
  }
}

// Export singleton instance — shared across all Next.js route handlers in same process
declare global {
  // eslint-disable-next-line no-var
  var __sseBroadcaster: SseBroadcaster | undefined;
}

// Use global to survive Next.js hot-reload in development
export const sseBroadcaster: SseBroadcaster =
  globalThis.__sseBroadcaster ?? (globalThis.__sseBroadcaster = new SseBroadcaster());
