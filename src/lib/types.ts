export type DeviceType = 'router' | 'switch' | 'access_point' | 'server' | 'firewall';
export type DeviceStatus = 'online' | 'warning' | 'offline' | 'unreachable';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type RepairStatus = 'berjalan' | 'selesai';
export type UserRole = 'admin' | 'petugas';
export type ReportFrequency = 'harian' | 'mingguan' | 'bulanan';
export type VpnType = 'wireguard' | 'l2tp' | 'sstp' | 'ipsec' | 'openvpn' | 'pptp';

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
  type: 'ethernet' | 'sfp' | 'wlan' | 'bridge' | 'vlan' | 'ovpn' | 'pptp' | 'l2tp' | 'pppoe';
  mac_address: string;
  status: 'up' | 'down';
  speed: string; // e.g. "100 Mbps (Fast Ethernet)", "1 Gbps", "10 Gbps"
  mtu?: number; // e.g. 1500
  l2_mtu?: number; // e.g. 1596
  rx_rate: number; // Mbps
  tx_rate: number; // Mbps
  rx_packet_ps?: number; // Rx Packet p/s (e.g. 1801)
  tx_packet_ps?: number; // Tx Packet p/s (e.g. 1008)
  fp_rx_rate?: number; // FastPath Rx Mbps
  fp_tx_rate?: number; // FastPath Tx Mbps
  rx_bytes: number; // Total bytes
  tx_bytes: number; // Total bytes
  error_rate: number; // pkts/sec
}

export interface QueueTraffic {
  id: string;
  device_id: string;
  name: string;
  parent?: string; // e.g. "global", "Total-Download", "Total-Upload", "ether1"
  packet_mark?: string; // e.g. "dev-in_pkt", "kantor-in_pkt", "no-mark"
  target: string; // IP, subnet, or parent node
  max_limit: string; // e.g. "50M" or "50M/50M"
  limit_at?: string; // e.g. "20M" (CIR guaranteed bandwidth)
  current_rate: { upload: number; download: number }; // Mbps
  packet_rate: number;
  dropped: number;
  priority?: number; // 1-8 (default: 8)
  queue_type?: string; // e.g. "pcq-download-default", "pcq-upload-default", "default"
  bytes?: number;
  packets?: number;
  kind?: 'tree' | 'simple';
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

export interface DashboardWidgetVisibility {
  throughput_chart: boolean;
  ping_gauge: boolean;
  simple_queues: boolean;
  vpn_status: boolean;
  recent_alerts: boolean;
}

export type RawMetricCategory =
  | 'system'
  | 'hardware_health'
  | 'cpu_cores'
  | 'memory_storage'
  | 'interfaces'
  | 'optical_sfp'
  | 'queue_tree'
  | 'simple_queues'
  | 'ip_addresses'
  | 'bridge_fdb'
  | 'dhcp_neighbors';

export interface RawSnmpMetric {
  id: string;
  device_id: string;
  oid: string;
  oid_name: string;
  category: RawMetricCategory;
  type: 'integer' | 'counter32' | 'counter64' | 'string' | 'timeticks' | 'ipaddress' | 'gauge' | 'hex_string';
  raw_value: string;
  parsed_value?: string;
  unit?: string;
  collected_at: string;
}

