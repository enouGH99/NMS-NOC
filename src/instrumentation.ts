/**
 * Next.js Server Startup Instrumentation Hook
 * Executes automatically when the NMS NOC backend server starts in Node.js runtime.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startSnmpBackgroundWorker } = await import('@/lib/snmp-worker');
    const interval = parseInt(process.env.SNMP_POLL_INTERVAL_SECONDS || '15', 10) || 15;
    startSnmpBackgroundWorker(interval);
  }
}
