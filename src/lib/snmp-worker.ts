/**
 * Background SNMP Exporter & Polling Daemon for NMS NOC
 * Automatically and continuously scrapes MikroTik hEX S metrics on a fixed interval
 * and persists them into raw_snmp_metrics and time-series tables in PostgreSQL.
 */

import { db } from '@/db';
import { devices, alertRules, alerts, deviceMetrics, rawSnmpMetrics } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { exportMikrotikHexSMetrics } from './mikrotik-exporter';

interface WorkerState {
  isRunning: boolean;
  intervalSeconds: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  totalCycles: number;
  lastScrapedCount: number;
  lastError: string | null;
}

const workerState: WorkerState = {
  isRunning: false,
  intervalSeconds: parseInt(process.env.SNMP_POLL_INTERVAL_SECONDS || '15', 10) || 15,
  lastRunAt: null,
  nextRunAt: null,
  totalCycles: 0,
  lastScrapedCount: 0,
  lastError: null,
};

let timerHandle: NodeJS.Timeout | null = null;
let isExecutingCycle = false;

/**
 * Run a single SNMP collection cycle for all registered network devices
 */
export async function runSnmpPollCycle(): Promise<{ success: boolean; devicesPolled: number; totalOids: number }> {
  if (isExecutingCycle) {
    return { success: false, devicesPolled: 0, totalOids: 0 };
  }

  isExecutingCycle = true;
  workerState.lastRunAt = new Date();
  let totalOidsExported = 0;
  let devicesPolled = 0;

  try {
    // 1. Fetch devices from PostgreSQL
    let deviceList = await db.select().from(devices);

    // If devices table is completely empty, insert default router (192.168.3.1)
    if (deviceList.length === 0) {
      const defaultRouter = {
        id: 'dev-1',
        name: 'MikroTik-hEX-S',
        type: 'router',
        ipAddress: '192.168.3.1',
        macAddress: 'CC:2D:E0:89:AB:01',
        model: 'MikroTik RB760iGS (hEX S)',
        isPriority: true,
        status: 'online',
        uptime: '0 menit',
        cpuUsage: 12,
        ramUsage: 28,
        storageUsage: 35,
        temperature: 42,
        latency: 1,
        snmpVersion: 'v2c',
        snmpCommunity: 'public_nms',
      };
      try {
        await db.insert(devices).values(defaultRouter);
        deviceList = await db.select().from(devices);
      } catch {}
    }

    // 2. Poll each device with valid IP address
    for (const dev of deviceList) {
      if (!dev.ipAddress || dev.ipAddress === '127.0.0.1' || dev.ipAddress === '0.0.0.0') {
        continue;
      }

      const community = dev.snmpCommunity || 'public_nms';
      const version = (dev.snmpVersion as any) || 'v2c';

      const exportRes = await exportMikrotikHexSMetrics(dev.id, {
        ipAddress: dev.ipAddress,
        community,
        version,
        timeoutMs: 3500,
        retries: 1,
      });

      if (exportRes.success) {
        totalOidsExported += exportRes.totalMetricsExported;
        devicesPolled++;

        // Record time-series metrics
        if (exportRes.systemSummary) {
          const now = new Date();
          const s = exportRes.systemSummary;
          const metricEntries = [
            { id: `dm-${dev.id}-cpu-${Date.now()}`, deviceId: dev.id, metricName: 'cpu_usage', metricLabel: 'Beban CPU', value: s.cpuUsage, unit: '%', collectedAt: now },
            { id: `dm-${dev.id}-ram-${Date.now()}`, deviceId: dev.id, metricName: 'ram_usage', metricLabel: 'Pemakaian RAM', value: s.ramUsage, unit: '%', collectedAt: now },
            { id: `dm-${dev.id}-temp-${Date.now()}`, deviceId: dev.id, metricName: 'temperature', metricLabel: 'Suhu Board', value: s.temperature, unit: '°C', collectedAt: now },
          ];

          try {
            await db.insert(deviceMetrics).values(metricEntries);
          } catch {}

          // 3. Automated Threshold Evaluation (Alert Rules)
          try {
            const rules = await db.select().from(alertRules).where(eq(alertRules.enabled, true));
            for (const rule of rules) {
              let currentValue = 0;
              if (rule.metric === 'cpu') currentValue = s.cpuUsage;
              else if (rule.metric === 'ram') currentValue = s.ramUsage;
              else if (rule.metric === 'temperature') currentValue = s.temperature;
              else if (rule.metric === 'latency') currentValue = 1;

              const thresholdNum = parseFloat(rule.threshold) || 80;
              let isTriggered = false;

              if (rule.condition === '>' && currentValue > thresholdNum) isTriggered = true;
              else if (rule.condition === '>=' && currentValue >= thresholdNum) isTriggered = true;
              else if (rule.condition === '<' && currentValue < thresholdNum) isTriggered = true;

              if (isTriggered) {
                // Check if active alert already exists
                const existingAlerts = await db
                  .select()
                  .from(alerts)
                  .where(and(eq(alerts.deviceId, dev.id), eq(alerts.acknowledged, false)));

                const alreadyTriggered = existingAlerts.some(a => a.message.includes(rule.name));
                if (!alreadyTriggered) {
                  await db.insert(alerts).values({
                    id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    deviceId: dev.id,
                    deviceName: dev.name,
                    ipAddress: dev.ipAddress,
                    message: `[${rule.name}] Nilai ${rule.metric.toUpperCase()} terdeteksi ${currentValue} (Threshold: ${rule.condition} ${rule.threshold})`,
                    severity: rule.escalationTier >= 2 ? 'critical' : 'warning',
                    triggeredAt: now,
                    acknowledged: false,
                  });
                }
              }
            }
          } catch (ruleErr) {
            // Suppress rule evaluation error
          }
        }
      }
    }

    workerState.lastScrapedCount = totalOidsExported;
    workerState.totalCycles++;
    workerState.lastError = null;

    return { success: true, devicesPolled, totalOids: totalOidsExported };
  } catch (err: any) {
    workerState.lastError = err.message;
    return { success: false, devicesPolled: 0, totalOids: 0 };
  } finally {
    isExecutingCycle = false;
    workerState.nextRunAt = new Date(Date.now() + workerState.intervalSeconds * 1000);
  }
}

/**
 * Start the Background SNMP Poller Singleton Daemon
 */
export function startSnmpBackgroundWorker(intervalSeconds?: number) {
  if (workerState.isRunning) {
    return;
  }

  if (intervalSeconds && intervalSeconds > 0) {
    workerState.intervalSeconds = intervalSeconds;
  }

  workerState.isRunning = true;
  console.log(`📡 [SNMP Worker] Daemon pengumpul data metrik SNMP aktif (Interval: ${workerState.intervalSeconds} detik)...`);

  // Execute initial collection immediately after 1.5 seconds
  setTimeout(() => {
    runSnmpPollCycle().catch(err => console.warn('[SNMP Worker] Initial scrape error:', err));
  }, 1500);

  // Set recurring interval timer
  timerHandle = setInterval(() => {
    runSnmpPollCycle().catch(err => console.warn('[SNMP Worker] Interval scrape error:', err));
  }, workerState.intervalSeconds * 1000);
}

/**
 * Stop the Background SNMP Poller Daemon
 */
export function stopSnmpBackgroundWorker() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
  workerState.isRunning = false;
  console.log('🛑 [SNMP Worker] Daemon pengumpul data SNMP dihentikan.');
}

/**
 * Get current status of the background worker
 */
export function getSnmpWorkerStatus() {
  return {
    ...workerState,
    nextRunInSeconds: workerState.nextRunAt ? Math.max(0, Math.round((workerState.nextRunAt.getTime() - Date.now()) / 1000)) : 0,
  };
}
