export type DeviceType = 'router' | 'switch' | 'access_point' | 'server' | 'firewall';
export type DeviceStatus = 'online' | 'warning' | 'offline' | 'unreachable';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type RepairStatus = 'berjalan' | 'selesai';
export type UserRole = 'admin' | 'petugas';
export type ReportFrequency = 'harian' | 'mingguan' | 'bulanan';
export type VpnType = 'wireguard' | 'l2tp' | 'sstp' | 'ipsec' | 'openvpn';

export interface Location {
  id: string;
  name: string;
  building: string;
  floor: string;
  description?: string;
  device_count?: number;
}

export interface SnmpV3Config {
  username: string;
  auth_protocol: 'MD5' | 'SHA' | 'SHA256';
  auth_key: string;
  privacy_protocol: 'DES' | 'AES' | 'AES256';
  privacy_key: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  ip_address: string;
  mac_address: string;
  model: string;
  location_id: string;
  location_name?: string;
  is_priority: boolean;
  status: DeviceStatus;
  last_seen: string;
  created_at: string;
  uptime: string;
  cpu_usage: number; // percentage 0-100
  ram_usage: number; // percentage 0-100
  storage_usage: number; // percentage 0-100
  temperature: number; // celcius
  voltage?: number; // volts
  latency: number; // ms
  packet_loss: number; // percentage
  parent_device_id?: string;
  snmp_version: 'v2c' | 'v3';
  snmp_community?: string;
  snmp_v3?: SnmpV3Config;
  coordinates?: { x: number; y: number };
}

export interface DeviceInterface {
  id: string;
  device_id: string;
  name: string;
  type: 'ethernet' | 'sfp' | 'wlan' | 'bridge' | 'vlan';
  mac_address: string;
  status: 'up' | 'down';
  speed: string; // e.g. "1 Gbps", "10 Gbps"
  rx_rate: number; // Mbps
  tx_rate: number; // Mbps
  rx_bytes: number; // Total bytes
  tx_bytes: number; // Total bytes
  error_rate: number; // pkts/sec
}

export interface QueueTraffic {
  id: string;
  device_id: string;
  name: string;
  target: string; // IP or subnet
  max_limit: string; // e.g. "50M/50M"
  current_rate: { upload: number; download: number }; // Mbps
  packet_rate: number;
  dropped: number;
}

export interface VpnTunnel {
  id: string;
  device_id: string;
  name: string;
  type: VpnType;
  user: string;
  remote_ip: string;
  status: 'connected' | 'disconnected';
  uptime: string;
  bytes_in: number;
  bytes_out: number;
}

export interface Alert {
  id: string;
  device_id: string;
  device_name: string;
  ip_address: string;
  message: string;
  severity: AlertSeverity;
  triggered_at: string;
  resolved_at?: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  device_id?: string; // or null for all devices
  metric: 'latency' | 'packet_loss' | 'cpu_usage' | 'offline_status' | 'bandwidth_threshold';
  condition: '>' | '<' | '==' | 'offline';
  threshold: number | string;
  duration_seconds: number;
  enabled: boolean;
  escalation_tier: 1 | 2 | 3;
  notify_email: boolean;
  notify_sound: boolean;
}

export interface RepairRecord {
  id: string;
  ticket_code: string;
  device_id: string;
  device_name: string;
  ip_address: string;
  user_id: string;
  user_name: string;
  problem: string;
  action: string;
  result: string;
  status: RepairStatus;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface ReportSchedule {
  id: string;
  name: string;
  frequency: ReportFrequency;
  format: 'pdf' | 'excel' | 'csv';
  recipients: string[];
  created_by: string;
  last_sent_at?: string;
  next_run_at: string;
  enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive';
  last_login: string;
  created_at: string;
  phone?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

export interface AutoDiscoveredDevice {
  id: string;
  ip: string;
  mac: string;
  suggested_name: string;
  type: DeviceType;
  snmp_detected: boolean;
  vendor: string;
  response_time: number;
  status: 'new' | 'approved' | 'ignored';
  discovered_at: string;
}

export interface CapacityMetric {
  date: string;
  bandwidth_used_mbps: number;
  bandwidth_capacity_mbps: number;
  storage_used_gb: number;
  storage_capacity_gb: number;
  predicted?: boolean;
}

// ----------------------------------------------------
// FASE 6 — AI NETWORK OPTIMIZER & LAN ROUTE TYPES
// ----------------------------------------------------

export interface AiLogAnomaly {
  id: string;
  timestamp: string;
  source_device: string;
  category: 'firewall_drop' | 'queue_congestion' | 'interface_flap' | 'cpu_spike' | 'dns_latency';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  log_sample: string;
  root_cause: string;
  impact: string;
}

export interface LanRouteRecommendation {
  id: string;
  title: string;
  target_subnet: string;
  current_route: string;
  recommended_route: string;
  current_bottleneck: string;
  expected_improvement: string;
  vlan_id?: number;
  priority: 'critical' | 'recommended' | 'optional';
  status: 'pending' | 'applied';
}

export interface DeviceOptimizationPlan {
  id: string;
  device_name: string;
  device_ip: string;
  category: 'qos_queue' | 'firewall_security' | 'resource_scheduling' | 'fasttrack_routing';
  title: string;
  description: string;
  impact_score: number; // e.g. +25% efficiency
  cli_script: string;
  applied: boolean;
  applied_at?: string;
}

export interface AiSimulationMetrics {
  current_avg_latency: number;
  predicted_avg_latency: number;
  current_packet_loss: number;
  predicted_packet_loss: number;
  current_cpu_peak: number;
  predicted_cpu_peak: number;
  network_health_score: number;
  predicted_health_score: number;
}

export interface DashboardWidgetVisibility {
  throughput_chart: boolean;
  ai_insights: boolean;
  ping_gauge: boolean;
  simple_queues: boolean;
  vpn_status: boolean;
  recent_alerts: boolean;
}

export type AiProvider = 'google_gemini' | 'openai' | 'anthropic_claude' | 'local_ollama';

export interface AiConfig {
  provider: AiProvider;
  model: string;
  api_key: string;
  custom_endpoint?: string;
  temperature: number;
  max_tokens: number;
  auto_scan_enabled: boolean;
  auto_scan_interval_minutes: number;
  auto_generate_scripts: boolean;
  notify_on_anomaly: boolean;
  connection_status: 'connected' | 'error' | 'untested';
  last_tested_at?: string;
  response_time_ms?: number;
}
