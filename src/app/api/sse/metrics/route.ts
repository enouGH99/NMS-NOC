/**
 * SSE Route Handler — /api/sse/metrics
 *
 * Opens a persistent HTTP streaming connection (text/event-stream) to each
 * browser client. The SNMP background worker broadcasts fresh telemetry data
 * through this endpoint whenever a poll cycle completes.
 *
 * Connection lifecycle:
 *  1. Browser connects → controller registered in sseBroadcaster
 *  2. SNMP worker calls sseBroadcaster.broadcast() → data pushed to all clients
 *  3. Heartbeat comment sent every 25s to prevent proxy/Nginx timeout
 *  4. On browser disconnect (AbortSignal) → controller removed, stream closed
 */

import { NextRequest } from 'next/server';
import { sseBroadcaster } from '@/lib/sse-manager';

// Force Node.js runtime — Edge runtime does not support ReadableStream + SSE
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let controller: ReadableStreamDefaultController<string> | null = null;

  const stream = new ReadableStream<string>({
    start(ctrl) {
      controller = ctrl;
      sseBroadcaster.addClient(ctrl);

      // Send initial connection acknowledgment event
      const initPayload = {
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'NMS SSE stream connected. Waiting for SNMP telemetry...',
        activeClients: sseBroadcaster.clientCount,
      };
      ctrl.enqueue(`data: ${JSON.stringify(initPayload)}\n\n`);

      // Heartbeat every 25 seconds — prevents Nginx/proxy from closing idle connections
      heartbeatTimer = setInterval(() => {
        try {
          ctrl.enqueue(`: heartbeat ${new Date().toISOString()}\n\n`);
        } catch {
          // Connection already closed
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 25000);
    },

    cancel() {
      // Called when client disconnects or stream is garbage collected
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (controller) sseBroadcaster.removeClient(controller);
    },
  });

  // Handle browser navigation away / tab close via AbortSignal
  request.signal.addEventListener('abort', () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (controller) {
      sseBroadcaster.removeClient(controller);
      try { controller.close(); } catch { /* already closed */ }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',      // Disable Nginx response buffering
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * GET /api/sse/status — Returns current broadcaster stats (for debugging)
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'X-SSE-Clients': String(sseBroadcaster.clientCount),
      'X-SSE-Status': JSON.stringify(sseBroadcaster.status),
    },
  });
}
