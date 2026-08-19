import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  json,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------
// 1. BETTER AUTH TABLES (Authentication & Session)
// ----------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: text('role').default('petugas').notNull(), // 'admin' | 'petugas'
  phone: text('phone'),
  status: text('status').default('active').notNull(), // 'active' | 'inactive'
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 2. LOCATIONS & SITES
// ----------------------------------------------------

export const locations = pgTable('locations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  building: text('building').notNull(),
  floor: text('floor').notNull(),
  description: text('description'),
  deviceCount: integer('device_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 3. NETWORK DEVICES (Routers, Switches, APs, Servers)
// ----------------------------------------------------

export const devices = pgTable('devices', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'router' | 'switch' | 'access_point' | 'server' | 'firewall'
  ipAddress: text('ip_address').notNull(),
  macAddress: text('mac_address'),
  model: text('model'),
  locationId: text('location_id').references(() => locations.id, { onDelete: 'set null' }),
  locationName: text('location_name'),
  isPriority: boolean('is_priority').default(false).notNull(),
  status: text('status').default('online').notNull(), // 'online' | 'offline' | 'warning' | 'unreachable'
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  uptime: text('uptime').default('0 menit'),
  cpuUsage: integer('cpu_usage').default(0),
  ramUsage: integer('ram_usage').default(0),
  storageUsage: integer('storage_usage').default(0),
  temperature: integer('temperature').default(0),
  latency: integer('latency').default(1),
  packetLoss: integer('packet_loss').default(0),
  parentDeviceId: text('parent_device_id'),
  snmpVersion: text('snmp_version').default('v2c'),
  snmpCommunity: text('snmp_community').default('public'),
  coordX: integer('coord_x').default(400),
  coordY: integer('coord_y').default(300),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 4. DEVICE INTERFACES (Ethernet & SFP Ports)
// ----------------------------------------------------

export const deviceInterfaces = pgTable('device_interfaces', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').default('ethernet').notNull(), // 'ethernet' | 'sfp' | 'wireless' | 'bridge' | 'vlan'
  status: text('status').default('up').notNull(), // 'up' | 'down'
  macAddress: text('mac_address'),
  speedMbps: integer('speed_mbps').default(1000),
  mtu: integer('mtu').default(1500),
  rxBytes: doublePrecision('rx_bytes').default(0),
  txBytes: doublePrecision('tx_bytes').default(0),
  rxErrors: integer('rx_errors').default(0),
  txErrors: integer('tx_errors').default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 5. MIKROTIK SIMPLE QUEUES (Bandwidth Management)
// ----------------------------------------------------

export const queueTraffics = pgTable('queue_traffics', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetSubnet: text('target_subnet').notNull(),
  maxLimitDownloadMbps: doublePrecision('max_limit_download_mbps').notNull(),
  maxLimitUploadMbps: doublePrecision('max_limit_upload_mbps').notNull(),
  currentDownloadMbps: doublePrecision('current_download_mbps').default(0).notNull(),
  currentUploadMbps: doublePrecision('current_upload_mbps').default(0).notNull(),
  packetDropsPerSec: integer('packet_drops_per_sec').default(0).notNull(),
  queueType: text('queue_type').default('default-small').notNull(),
  priority: integer('priority').default(8).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 6. VPN TUNNELS (WireGuard, L2TP, IPsec, OpenVPN)
// ----------------------------------------------------

export const vpnTunnels = pgTable('vpn_tunnels', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'wireguard' | 'l2tp' | 'ipsec' | 'openvpn' | 'pptp'
  user: text('user').notNull(),
  remoteIp: text('remote_ip').notNull(),
  status: text('status').default('connected').notNull(), // 'connected' | 'disconnected'
  uptime: text('uptime').default('0s'),
  bytesIn: doublePrecision('bytes_in').default(0),
  bytesOut: doublePrecision('bytes_out').default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 7. TIME-SERIES METRICS & DEVICE HISTORY
// ----------------------------------------------------

export const deviceMetrics = pgTable('device_metrics', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  metricName: text('metric_name').notNull(), // 'latency' | 'cpu_usage' | 'throughput' | 'ram_usage'
  metricLabel: text('metric_label'),
  value: doublePrecision('value').notNull(),
  unit: text('unit').notNull(), // 'ms' | '%' | 'Mbps' | 'bytes'
  collectedAt: timestamp('collected_at').defaultNow().notNull(),
});

export const deviceStatusHistory = pgTable('device_status_history', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
});

export const snmpConfigs = pgTable('snmp_configs', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  version: text('version').default('v2c').notNull(), // 'v2c' | 'v3'
  community: text('community').default('public'),
  username: text('username'),
  authProtocol: text('auth_protocol'),
  authKey: text('auth_key'),
  privacyProtocol: text('privacy_protocol'),
  privacyKey: text('privacy_key'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 8. ALERTS & INCIDENT TRIAGE
// ----------------------------------------------------

export const alerts = pgTable('alerts', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  deviceName: text('device_name').notNull(),
  ipAddress: text('ip_address').notNull(),
  message: text('message').notNull(),
  severity: text('severity').notNull(), // 'info' | 'warning' | 'critical'
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  acknowledged: boolean('acknowledged').default(false).notNull(),
  acknowledgedBy: text('acknowledged_by'),
  resolvedBy: text('resolved_by'),
  resolutionNotes: text('resolution_notes'),
});

export const alertRules = pgTable('alert_rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  deviceId: text('device_id'),
  metric: text('metric').notNull(),
  condition: text('condition').notNull(),
  threshold: text('threshold').notNull(),
  durationSeconds: integer('duration_seconds').default(60).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  escalationTier: integer('escalation_tier').default(1).notNull(),
  notifyEmail: boolean('notify_email').default(true).notNull(),
  notifySound: boolean('notify_sound').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  alertId: text('alert_id').notNull().references(() => alerts.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 9. REPAIR RECORDS & ATTACHMENTS
// ----------------------------------------------------

export const repairRecords = pgTable('repair_records', {
  id: text('id').primaryKey(),
  ticketCode: text('ticket_code').notNull().unique(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  deviceName: text('device_name').notNull(),
  ipAddress: text('ip_address').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  userName: text('user_name').notNull(),
  problem: text('problem').notNull(),
  action: text('action').notNull(),
  result: text('result').notNull(),
  status: text('status').default('berjalan').notNull(), // 'berjalan' | 'selesai'
  photoUrls: json('photo_urls').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 10. REPORT SCHEDULES & AUDIT LOGS
// ----------------------------------------------------

export const reportSchedules = pgTable('report_schedules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  frequency: text('frequency').notNull(), // 'harian' | 'mingguan' | 'bulanan'
  format: text('format').default('pdf').notNull(), // 'pdf' | 'excel' | 'csv'
  recipients: json('recipients').$type<string[]>().default([]).notNull(),
  createdBy: text('created_by').notNull(),
  lastSentAt: timestamp('last_sent_at'),
  nextRunAt: timestamp('next_run_at').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  ipAddress: text('ip_address').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const autoDiscoveredDevices = pgTable('auto_discovered_devices', {
  id: text('id').primaryKey(),
  ip: text('ip').notNull(),
  mac: text('mac').notNull(),
  suggestedName: text('suggested_name').notNull(),
  type: text('type').notNull(),
  snmpDetected: boolean('snmp_detected').default(false).notNull(),
  vendor: text('vendor').notNull(),
  responseTime: integer('response_time').default(5).notNull(),
  status: text('status').default('new').notNull(), // 'new' | 'approved' | 'ignored'
  discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 11. AI NETWORK OPTIMIZER (Fase 6)
// ----------------------------------------------------

export const aiLogAnomalies = pgTable('ai_log_anomalies', {
  id: text('id').primaryKey(),
  sourceDevice: text('source_device').notNull(),
  category: text('category').notNull(), // 'firewall_drop' | 'queue_congestion' | 'interface_flap' | 'cpu_spike' | 'dns_latency'
  severity: text('severity').notNull(), // 'high' | 'medium' | 'low'
  title: text('title').notNull(),
  description: text('description').notNull(),
  logSample: text('log_sample').notNull(),
  rootCause: text('root_cause').notNull(),
  impact: text('impact').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const lanRouteRecommendations = pgTable('lan_route_recommendations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  targetSubnet: text('target_subnet').notNull(),
  currentRoute: text('current_route').notNull(),
  recommendedRoute: text('recommended_route').notNull(),
  currentBottleneck: text('current_bottleneck').notNull(),
  expectedImprovement: text('expected_improvement').notNull(),
  vlanId: integer('vlan_id'),
  priority: text('priority').notNull(), // 'critical' | 'recommended' | 'optional'
  status: text('status').default('pending').notNull(), // 'pending' | 'applied'
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deviceOptimizationPlans = pgTable('device_optimization_plans', {
  id: text('id').primaryKey(),
  deviceName: text('device_name').notNull(),
  deviceIp: text('device_ip').notNull(),
  category: text('category').notNull(), // 'qos_queue' | 'firewall_security' | 'resource_scheduling' | 'fasttrack_routing'
  title: text('title').notNull(),
  description: text('description').notNull(),
  impactScore: integer('impact_score').notNull(),
  cliScript: text('cli_script').notNull(),
  applied: boolean('applied').default(false).notNull(),
  appliedAt: timestamp('applied_at'),
});

export const aiConfigs = pgTable('ai_configs', {
  id: text('id').primaryKey().default('default_config'),
  provider: text('provider').default('google_gemini').notNull(),
  model: text('model').default('gemini-2.5-flash').notNull(),
  apiKey: text('api_key').default('').notNull(),
  customEndpoint: text('custom_endpoint').default(''),
  temperature: doublePrecision('temperature').default(0.2).notNull(),
  maxTokens: integer('max_tokens').default(4096).notNull(),
  autoScanEnabled: boolean('auto_scan_enabled').default(true).notNull(),
  autoScanIntervalMinutes: integer('auto_scan_interval_minutes').default(15).notNull(),
  autoGenerateScripts: boolean('auto_generate_scripts').default(true).notNull(),
  notifyOnAnomaly: boolean('notify_on_anomaly').default(true).notNull(),
  connectionStatus: text('connection_status').default('connected').notNull(),
  lastTestedAt: timestamp('last_tested_at'),
  responseTimeMs: integer('response_time_ms').default(215),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 12. TABLE RELATIONS
// ----------------------------------------------------

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  repairRecords: many(repairRecords),
  notifications: many(notifications),
}));

export const deviceRelations = relations(devices, ({ one, many }) => ({
  location: one(locations, {
    fields: [devices.locationId],
    references: [locations.id],
  }),
  interfaces: many(deviceInterfaces),
  queues: many(queueTraffics),
  vpnTunnels: many(vpnTunnels),
  metrics: many(deviceMetrics),
  alerts: many(alerts),
  repairs: many(repairRecords),
  snmpConfig: one(snmpConfigs, {
    fields: [devices.id],
    references: [snmpConfigs.deviceId],
  }),
}));

export const alertRelations = relations(alerts, ({ one, many }) => ({
  device: one(devices, {
    fields: [alerts.deviceId],
    references: [devices.id],
  }),
  notifications: many(notifications),
}));
