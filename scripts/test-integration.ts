/**
 * Automated Integration Test Suite for NMS-NOC
 * Tests all backend API routes, handlers, error states, and client-backend contracts.
 */

import { NextRequest } from 'next/server';

// Import Route Handlers
import * as StatsRoute from '../src/app/api/stats/route';
import * as DevicesRoute from '../src/app/api/devices/route';
import * as DeviceDetailRoute from '../src/app/api/devices/[id]/route';
import * as DevicePingRoute from '../src/app/api/devices/[id]/ping/route';
import * as LocationsRoute from '../src/app/api/locations/route';
import * as AlertsRoute from '../src/app/api/alerts/route';
import * as AlertAckRoute from '../src/app/api/alerts/[id]/acknowledge/route';
import * as AlertResolveRoute from '../src/app/api/alerts/[id]/resolve/route';
import * as AlertRulesRoute from '../src/app/api/alert-rules/route';
import * as RepairsRoute from '../src/app/api/repairs/route';
import * as ReportsRoute from '../src/app/api/reports/route';
import * as TopologyRoute from '../src/app/api/topology/route';
import * as DiscoveryRoute from '../src/app/api/discovery/route';
import * as UsersRoute from '../src/app/api/users/route';
import * as AuditLogsRoute from '../src/app/api/audit-logs/route';
import * as QueuesRoute from '../src/app/api/queues/route';
import * as RawMetricsRoute from '../src/app/api/devices/[id]/raw-metrics/route';
import * as AdvisorRoute from '../src/app/api/advisor/route';
import * as HealthRoute from '../src/app/api/health/route';
import * as BackupRoute from '../src/app/api/backup/route';
import { db } from '../src/db';
import { devices } from '../src/db/schema';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  error?: any;
}

const results: TestResult[] = [];

function createRequest(url: string, method: string = 'GET', body?: any): NextRequest {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as any);
}

async function runTest(category: string, name: string, fn: () => Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round(performance.now() - start);
    results.push({ category, name, passed: true, durationMs });
    console.log(`  ✓ [PASS] [${category}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - start);
    results.push({ category, name, passed: false, durationMs, error: err?.message || err });
    console.error(`  ✗ [FAIL] [${category}] ${name} (${durationMs}ms) -> ${err?.message || err}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAllIntegrationTests() {
  console.log('\n======================================================');
  console.log('🚀 MEMULAI INTEGRATION TESTING: FRONTEND & BACKEND NMS');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // 1. STATS & NOC DASHBOARD API
  // ----------------------------------------------------
  await runTest('Stats API', 'GET /api/stats returns SLA & device counters', async () => {
    const res = await StatsRoute.GET();
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected json.success to be true');
    assert(typeof json.data.totalDevices === 'number', 'Expected totalDevices to be a number');
    assert(typeof json.data.onlineCount === 'number', 'Expected onlineCount to be a number');
    assert(typeof json.data.slaPercent === 'number', 'Expected slaPercent to be a number');
    assert(json.data.slaPercent >= 0 && json.data.slaPercent <= 100, 'SLA must be between 0 and 100');
    assert(typeof json.data.currentInboundMbps === 'number', 'Expected currentInboundMbps');
  });

  // ----------------------------------------------------
  // 2. LOCATIONS API (Create & List)
  // ----------------------------------------------------
  let createdLocationId = '';

  await runTest('Locations API', 'POST /api/locations creates new location in database', async () => {
    const payload = { name: 'Data Center Gedung C', building: 'Gedung C', floor: 'Lantai B1', description: 'Server rack room' };
    const req = createRequest('/api/locations', 'POST', payload);
    const res = await LocationsRoute.POST(req);
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.building === 'Gedung C', 'Expected building to match');
    assert(json.data.id !== undefined, 'Expected location id');
    createdLocationId = json.data.id;
  });

  await runTest('Locations API', 'GET /api/locations returns site locations from database', async () => {
    const res = await LocationsRoute.GET();
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected locations array');
    assert(json.data.length >= 1, 'Expected at least 1 location');
  });

  // ----------------------------------------------------
  // 3. DEVICES & INVENTORY API (CRUD & Filtering & Ping)
  // ----------------------------------------------------
  let createdDeviceId = '';

  await runTest('Devices API', 'POST /api/devices creates a new device in PostgreSQL', async () => {
    const payload = {
      name: 'Router Core Test',
      type: 'router',
      ip_address: '192.168.99.1',
      mac_address: 'AA:BB:CC:DD:EE:FF',
      model: 'MikroTik CCR2004-16G-2S+',
      location_id: createdLocationId || 'loc-1',
      location_name: 'Data Center Gedung C',
      is_priority: true,
      snmp_version: 'v2c',
      snmp_community: 'public',
    };
    const req = createRequest('/api/devices', 'POST', payload);
    const res = await DevicesRoute.POST(req);
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.id !== undefined, 'Expected generated device ID');
    assert(json.data.name === payload.name, 'Expected device name to match');
    createdDeviceId = json.data.id;
  });

  await runTest('Devices API', 'GET /api/devices returns all devices list', async () => {
    const req = createRequest('/api/devices');
    const res = await DevicesRoute.GET(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected data to be an array');
    assert(json.data.length >= 1, 'Expected at least 1 device in database');
  });

  await runTest('Devices API', 'GET /api/devices with location filter', async () => {
    const req = createRequest(`/api/devices?locationId=${createdLocationId || 'loc-1'}`);
    const res = await DevicesRoute.GET(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected filtered array');
  });

  await runTest('Devices API', 'GET /api/devices/[id] retrieves device details and sub-tables', async () => {
    const targetId = createdDeviceId;
    const req = createRequest(`/api/devices/${targetId}`);
    const res = await DeviceDetailRoute.GET(req, { params: Promise.resolve({ id: targetId }) });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.id === targetId, `Expected id to be ${targetId}`);
    assert(Array.isArray(json.data.interfaces), 'Expected interfaces array');
    assert(Array.isArray(json.data.queues), 'Expected queues array');
    assert(Array.isArray(json.data.vpnTunnels), 'Expected vpnTunnels array');
  });

  await runTest('Devices API', 'GET /api/devices/[id] returns 404 for unknown device', async () => {
    const req = createRequest(`/api/devices/non-existent-id`);
    const res = await DeviceDetailRoute.GET(req, { params: Promise.resolve({ id: 'non-existent-id' }) });
    assert(res.status === 404, `Expected status 404, got ${res.status}`);
  });

  await runTest('Devices API', 'PUT /api/devices/[id] updates device metadata', async () => {
    const targetId = createdDeviceId;
    const payload = { name: 'Router Core Test (Updated)', is_priority: false };
    const req = createRequest(`/api/devices/${targetId}`, 'PUT', payload);
    const res = await DeviceDetailRoute.PUT(req, { params: Promise.resolve({ id: targetId }) });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
  });

  await runTest('Devices API', 'POST /api/devices/[id]/ping runs connection simulation test', async () => {
    const targetId = createdDeviceId;
    const req = createRequest(`/api/devices/${targetId}/ping`, 'POST', {});
    const res = await DevicePingRoute.POST(req, { params: Promise.resolve({ id: targetId }) });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(typeof json.latency === 'number', 'Expected latency number');
    assert(typeof json.packetLoss === 'number', 'Expected packetLoss number');
    assert(Array.isArray(json.packets), 'Expected 4 ping packets array');
    assert(json.packets.length === 4, 'Expected 4 packets');
  });

  await runTest('Devices API', 'DELETE /api/devices/[id] removes device', async () => {
    const targetId = createdDeviceId;
    const req = createRequest(`/api/devices/${targetId}`, 'DELETE');
    const res = await DeviceDetailRoute.DELETE(req, { params: Promise.resolve({ id: targetId }) });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  // ----------------------------------------------------
  // 4. ALERTS & ACKNOWLEDGE / RESOLVE WORKFLOW
  // ----------------------------------------------------
  let createdAlertId = '';

  await runTest('Alerts API', 'GET /api/alerts returns all alerts', async () => {
    const req = createRequest('/api/alerts');
    const res = await AlertsRoute.GET(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected alerts array');
  });

  await runTest('Alerts API', 'GET /api/alerts?activeOnly=true filters active alerts', async () => {
    const req = createRequest('/api/alerts?activeOnly=true');
    const res = await AlertsRoute.GET(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
  });

  await runTest('Alerts API', 'POST /api/alerts triggers new network alert', async () => {
    const payload = {
      device_id: 'dev-1',
      device_name: 'Router Core Utama',
      ip_address: '192.168.1.1',
      message: 'High CPU Load detected (>90%)',
      severity: 'critical',
    };
    const req = createRequest('/api/alerts', 'POST', payload);
    const res = await AlertsRoute.POST(req);
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.id !== undefined, 'Expected alert ID');
    createdAlertId = json.data.id;
  });

  await runTest('Alerts API', 'POST /api/alerts/[id]/acknowledge marks alert acknowledged', async () => {
    const targetId = createdAlertId || 'alt-1';
    const req = createRequest(`/api/alerts/${targetId}/acknowledge`, 'POST', { userName: 'Petugas NOC 1' });
    const res = await AlertAckRoute.POST(req, { params: Promise.resolve({ id: targetId }) });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.acknowledged === true, 'Expected acknowledged === true');
  });

  await runTest('Alerts API', 'POST /api/alerts/[id]/resolve resolves alert with notes', async () => {
    const targetId = createdAlertId || 'alt-1';
    const payload = { notes: 'Proses firewall loop telah di-kill dan CPU stabil di 22%', userName: 'Petugas NOC 1' };
    const req = createRequest(`/api/alerts/${targetId}/resolve`, 'POST', payload);
    const res = await AlertResolveRoute.POST(req, { params: Promise.resolve({ id: targetId }) });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.resolutionNotes !== undefined, 'Expected resolutionNotes in response');
  });

  // ----------------------------------------------------
  // 5. ALERT RULES & ESCALATION TIERS API
  // ----------------------------------------------------
  await runTest('Alert Rules API', 'GET /api/alert-rules returns threshold rules', async () => {
    const res = await AlertRulesRoute.GET();
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected alert rules array');
  });

  await runTest('Alert Rules API', 'POST /api/alert-rules creates new automated rule', async () => {
    const payload = {
      name: 'High Latency Alarm > 50ms',
      metric: 'latency',
      condition: '>',
      threshold: 50,
      duration_seconds: 120,
      escalation_tier: 2,
      notify_email: true,
      notify_sound: true,
    };
    const req = createRequest('/api/alert-rules', 'POST', payload);
    const res = await AlertRulesRoute.POST(req);
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.name === payload.name, 'Expected rule name to match');
  });

  // ----------------------------------------------------
  // 6. REPAIR RECORDS & TICKETING API
  // ----------------------------------------------------
  await runTest('Repairs API', 'GET /api/repairs returns maintenance history', async () => {
    const res = await RepairsRoute.GET();
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected repair records array');
  });

  await runTest('Repairs API', 'POST /api/repairs creates repair ticket with code generation', async () => {
    const payload = {
      device_id: 'dev-2',
      device_name: 'Switch Core Ruang Server',
      ip_address: '192.168.1.2',
      user_name: 'Teknisi Lapangan',
      problem: 'Port SFP 1 flapping',
      action: 'Pembersihan modul optik patch cord SFP',
      result: 'Link UP stabil 10 Gbps',
      status: 'selesai',
    };
    const req = createRequest('/api/repairs', 'POST', payload);
    const res = await RepairsRoute.POST(req);
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.ticketCode && json.data.ticketCode.startsWith('TKT-'), 'Expected generated ticketCode format');
  });

  // ----------------------------------------------------
  // 7. REPORTS & CAPACITY PLANNING API
  // ----------------------------------------------------
  await runTest('Reports API', 'GET /api/reports returns schedules, capacity trends & monthly SLA', async () => {
    const res = await ReportsRoute.GET();
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data.schedules), 'Expected schedules array');
    assert(Array.isArray(json.data.capacityTrend), 'Expected capacityTrend array');
    assert(Array.isArray(json.data.monthlySla), 'Expected monthlySla array');
  });

  await runTest('Reports API', 'POST /api/reports adds automated report schedule', async () => {
    const payload = {
      name: 'Laporan SLA Eksekutif Bulanan',
      frequency: 'bulanan',
      format: 'pdf',
      recipients: ['pimpinan@perusahaan.co.id'],
      created_by: 'Admin NOC',
    };
    const req = createRequest('/api/reports', 'POST', payload);
    const res = await ReportsRoute.POST(req);
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.name === payload.name, 'Expected schedule name match');
  });

  // ----------------------------------------------------
  // 8. TOPOLOGY & DEPENDENCY GRAPH API
  // ----------------------------------------------------
  await runTest('Topology API', 'GET /api/topology returns graph nodes & dependency edges', async () => {
    const res = await TopologyRoute.GET();
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data.nodes), 'Expected nodes array');
    assert(Array.isArray(json.data.edges), 'Expected edges array');
    assert(typeof json.data.totalNodes === 'number', 'Expected totalNodes number');
    assert(typeof json.data.totalEdges === 'number', 'Expected totalEdges number');
  });

  // ----------------------------------------------------
  // 9. AUTO-DISCOVERY API
  // ----------------------------------------------------
  let discoveredDeviceId = '';

  await runTest('Discovery API', 'GET /api/discovery returns discovered devices', async () => {
    const req = createRequest('/api/discovery', 'GET');
    const res = await DiscoveryRoute.GET(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected discovered list array');
  });

  await runTest('Discovery API', 'POST /api/discovery starts subnet sweep scan', async () => {
    const req = createRequest('/api/discovery', 'POST', { subnet: '192.168.10.0/24' });
    const res = await DiscoveryRoute.POST(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected discovered items in scan');
    if (json.data.length > 0) {
      discoveredDeviceId = json.data[0].id;
    }
  });

  await runTest('Discovery API', 'PUT /api/discovery approves discovered device', async () => {
    const targetId = discoveredDeviceId || 'dsc-1';
    const req = createRequest('/api/discovery', 'PUT', { id: targetId, action: 'approve' });
    const res = await DiscoveryRoute.PUT(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.status === 'approved', 'Expected status to be approved');
  });

  // ----------------------------------------------------
  // 10. USER MANAGEMENT & RBAC API
  // ----------------------------------------------------
  let testUserId = '';

  await runTest('Users API', 'GET /api/users returns user roster', async () => {
    const res = await UsersRoute.GET();
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected users array');
  });

  await runTest('Users API', 'POST /api/users creates new user', async () => {
    const payload = {
      name: 'Rudi Pratama',
      email: 'rudi.pratama@noc-perusahaan.id',
      role: 'petugas',
      phone: '+628123456789',
    };
    const req = createRequest('/api/users', 'POST', payload);
    const res = await UsersRoute.POST(req);
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.id !== undefined, 'Expected user id');
    testUserId = json.data.id;
  });

  await runTest('Users API', 'PUT /api/users updates user role & status', async () => {
    const targetId = testUserId || 'usr-2';
    const payload = { id: targetId, role: 'admin', status: 'active' };
    const req = createRequest('/api/users', 'PUT', payload);
    const res = await UsersRoute.PUT(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
  });

  await runTest('Users API', 'DELETE /api/users removes user by ID query param', async () => {
    const targetId = testUserId || 'usr-999';
    const req = createRequest(`/api/users?id=${targetId}`, 'DELETE');
    const res = await UsersRoute.DELETE(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
  });

  // ----------------------------------------------------
  // 11. AUDIT LOGS API
  // ----------------------------------------------------
  await runTest('Audit Logs API', 'GET /api/audit-logs returns security trails', async () => {
    const res = await AuditLogsRoute.GET();
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected audit logs array');
  });

  await runTest('Audit Logs API', 'POST /api/audit-logs records security audit event', async () => {
    const payload = {
      action: 'INTEGRATION_TEST_EXECUTION',
      details: 'Menjalankan rangkaian tes integrasi otomatis',
      user_id: 'usr-1',
      user_name: 'Budi Santoso',
      user_role: 'admin',
    };
    const req = createRequest('/api/audit-logs', 'POST', payload);
    const res = await AuditLogsRoute.POST(req);
    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
  });

  // ----------------------------------------------------
  // 12. MIKROTIK QUEUE TREE API
  // ----------------------------------------------------
  let createdQueueId = '';

  await runTest('Queue Tree API', 'GET /api/queues returns Queue Tree list from PostgreSQL or Router', async () => {
    const req = createRequest('/api/queues');
    const res = await QueuesRoute.GET(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected queues array');
  });

  await runTest('Queue Tree API', 'POST /api/queues creates a new Queue Tree entry with parent, packet_mark, CIR & MIR', async () => {
    // Ensure at least one router device exists
    const devList = await db.select().from(devices);
    let devId = devList[0]?.id;
    if (!devId) {
      devId = 'dev-test-router';
      try {
        await db.insert(devices).values({
          id: devId,
          name: 'MikroTik Test Gateway',
          type: 'router',
          ipAddress: '192.168.3.1',
          status: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch {}
    }

    const payload = {
      device_id: devId,
      name: 'WiFi-Tamu-Download',
      parent: 'Total-Download',
      packet_mark: 'guest-in_pkt',
      max_limit: '25M',
      limit_at: '5M',
      priority: 7,
      queue_type: 'pcq-download-default',
    };
    const req = createRequest('/api/queues', 'POST', payload);
    const res = await QueuesRoute.POST(req);
    const json = await res.json();
    if (res.status !== 201) {
      console.error('POST /api/queues error:', json);
    }
    assert(res.status === 201, `Expected status 201, got ${res.status}: ${json.error || ''}`);
    assert(json.success === true, 'Expected success === true');
    assert(json.data.name === 'WiFi-Tamu-Download', 'Expected queue name to match');
    assert(json.data.parent === 'Total-Download', 'Expected parent to match');
    assert(json.data.packet_mark === 'guest-in_pkt', 'Expected packet_mark to match');
    assert(json.data.priority === 7, 'Expected priority to match');
    createdQueueId = json.data.id;
  });

  await runTest('Queue Tree API', 'PUT /api/queues updates Queue Tree limits & priority', async () => {
    const targetId = createdQueueId || 'q-1';
    const payload = {
      id: targetId,
      max_limit: '35M',
      limit_at: '10M',
      priority: 6,
    };
    const req = createRequest('/api/queues', 'PUT', payload);
    const res = await QueuesRoute.PUT(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.data.max_limit === '35M', 'Expected max_limit 35M');
    assert(json.data.limit_at === '10M', 'Expected limit_at 10M');
    assert(json.data.priority === 6, 'Expected priority 6');
  });

  await runTest('Queue Tree API', 'DELETE /api/queues removes queue by ID', async () => {
    const targetId = createdQueueId;
    if (targetId) {
      const req = createRequest(`/api/queues?id=${targetId}`, 'DELETE');
      const res = await QueuesRoute.DELETE(req);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, 'Expected success === true');
    }
  });

  // ----------------------------------------------------
  // 13. RAW SNMP METRICS API (MikroTik hEX S RouterOS v6.48.4)
  // ----------------------------------------------------
  await runTest('Raw SNMP API', 'GET /api/devices/[id]/raw-metrics returns raw OIDs and categories from database', async () => {
    const devList = await db.select().from(devices);
    const targetDeviceId = devList[0]?.id || 'dev-1';
    const req = createRequest(`/api/devices/${targetDeviceId}/raw-metrics?category=all`);
    const res = await RawMetricsRoute.GET(req, { params: Promise.resolve({ id: targetDeviceId }) });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(Array.isArray(json.data), 'Expected array of raw metrics');
    assert(typeof json.totalCount === 'number', 'Expected totalCount number');
  });

  // ----------------------------------------------------
  // 14. NOC AI ADVISOR & COPILOT API (Tahap 6)
  // ----------------------------------------------------
  await runTest('AI Advisor API', 'GET /api/advisor returns active AI provider status', async () => {
    const req = createRequest('/api/advisor');
    const res = await AdvisorRoute.GET(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(typeof json.config?.provider === 'string', 'Expected provider string');
  });

  await runTest('AI Advisor API', 'POST /api/advisor runs AI diagnostics and returns RCA & scripts', async () => {
    const req = createRequest('/api/advisor', 'POST', {
      prompt: 'Diagnosa anomali jaringan dan buatkan script QoS Queue Tree PCQ MikroTik',
    });
    const res = await AdvisorRoute.POST(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(typeof json.answer === 'string', 'Expected answer text string');
    assert(typeof json.providerUsed === 'string', 'Expected providerUsed string');
    assert(typeof json.anomalyReport?.overallHealthScore === 'number', 'Expected health score number');
    assert(Array.isArray(json.recommendedScripts), 'Expected recommendedScripts array');
  });

  await runTest('AI Advisor API', 'PUT /api/advisor tests and updates AI provider credentials', async () => {
    const req = createRequest('/api/advisor', 'PUT', {
      provider: 'builtin',
      modelName: 'NOC-Expert-Heuristic-v2',
    });
    const res = await AdvisorRoute.PUT(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
  });

  // ----------------------------------------------------
  // 15. SYSTEM HEALTHCHECK API (Tahap 6 Hardening)
  // ----------------------------------------------------
  await runTest('Health API', 'GET /api/health verifies PostgreSQL, Memory, and Uptime', async () => {
    const res = await HealthRoute.GET();
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.status === 'healthy', 'Expected status === healthy');
    assert(typeof json.uptimeSeconds === 'number', 'Expected uptimeSeconds number');
    assert(json.services?.database?.status === 'healthy', 'Expected DB status healthy');
  });

  // ----------------------------------------------------
  // 16. AUTOMATED DATABASE BACKUP API
  // ----------------------------------------------------
  await runTest('Backup API', 'GET /api/backup returns backup files list and retention policy', async () => {
    const req = createRequest('/api/backup');
    const res = await BackupRoute.GET(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(json.retentionDays === 14, 'Expected retentionDays === 14');
    assert(Array.isArray(json.backups), 'Expected backups array');
  });

  await runTest('Backup API', 'POST /api/backup creates an on-demand database snapshot', async () => {
    const req = createRequest('/api/backup', 'POST');
    const res = await BackupRoute.POST(req);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, 'Expected success === true');
    assert(typeof json.backupFile?.fileName === 'string', 'Expected backup fileName');
  });

  // ----------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log('📊 HASIL PENGETESAN INTEGRASI (INTEGRATION TEST SUMMARY)');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const totalDuration = results.reduce((a, b) => a + b.durationMs, 0);

  console.log(`Total Pengujian: ${total}`);
  console.log(`Berhasil (Pass): ${passed}`);
  console.log(`Gagal (Fail):    ${failed}`);
  console.log(`Waktu Eksekusi:  ${totalDuration}ms`);

  if (failed > 0) {
    console.error('\nDetail Kegagalan:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.error(` - [${r.category}] ${r.name}: ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log(`\n🎉 SEMUA ${total} INTEGRATION TESTS BERHASIL DENGAN STATUS 100% PASS!`);
    process.exit(0);
  }
}

runAllIntegrationTests();
