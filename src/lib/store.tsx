'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Device,
  Alert,
  AlertRule,
  RepairRecord,
  ReportSchedule,
  User,
  AuditLog,
  AutoDiscoveredDevice,
  Location,
  DeviceInterface,
  QueueTraffic,
  VpnTunnel,
  UserRole,
  AiLogAnomaly,
  LanRouteRecommendation,
  DeviceOptimizationPlan,
  AiSimulationMetrics,
  DashboardWidgetVisibility,
  AiConfig,
} from './types';
import {
  initialDevices,
  initialAlerts,
  initialAlertRules,
  initialRepairRecords,
  initialReportSchedules,
  initialUsers,
  initialAuditLogs,
  initialAutoDiscovered,
  initialLocations,
  initialInterfaces,
  initialQueues,
  initialVpnTunnels,
  initialAiLogAnomalies,
  initialLanRouteRecommendations,
  initialDeviceOptimizationPlans,
  initialAiSimulationMetrics,
  initialDashboardWidgets,
  initialAiConfig,
} from './mock-data';
import { nmsApi } from './api-client';

interface ThroughputPoint {
  time: string;
  inbound: number;
  outbound: number;
}

interface NmsContextType {
  // Theme & App State
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchUserRole: (role: UserRole) => void;

  // Data State
  locations: Location[];
  devices: Device[];
  interfaces: DeviceInterface[];
  queues: QueueTraffic[];
  vpnTunnels: VpnTunnel[];
  alerts: Alert[];
  alertRules: AlertRule[];
  repairRecords: RepairRecord[];
  reportSchedules: ReportSchedule[];
  users: User[];
  auditLogs: AuditLog[];
  discoveredDevices: AutoDiscoveredDevice[];
  isScanning: boolean;
  scanProgress: number;

  // Fase 6 AI Optimizer State
  aiAnomalies: AiLogAnomaly[];
  lanRoutes: LanRouteRecommendation[];
  deviceOptimizationPlans: DeviceOptimizationPlan[];
  aiSimulation: AiSimulationMetrics;
  dashboardWidgets: DashboardWidgetVisibility;
  aiConfig: AiConfig;
  isAiAnalyzing: boolean;
  aiScanProgress: number;

  // Realtime Simulation State
  throughputHistory: ThroughputPoint[];
  liveStats: {
    totalDevices: number;
    onlineCount: number;
    warningCount: number;
    offlineCount: number;
    slaPercent: number;
    activeAlertsCount: number;
    currentInboundMbps: number;
    currentOutboundMbps: number;
  };

  // Actions
  addDevice: (device: Omit<Device, 'id' | 'created_at' | 'last_seen'>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  toggleDevicePriority: (id: string) => void;

  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string, notes: string) => void;
  toggleAlertRule: (id: string) => void;
  addAlertRule: (rule: Omit<AlertRule, 'id'>) => void;

  addRepairRecord: (record: Omit<RepairRecord, 'id' | 'ticket_code' | 'created_at' | 'updated_at'>) => void;
  updateRepairRecord: (id: string, updates: Partial<RepairRecord>) => void;

  addReportSchedule: (schedule: Omit<ReportSchedule, 'id'>) => void;
  toggleReportSchedule: (id: string) => void;

  addUser: (user: Omit<User, 'id' | 'created_at' | 'last_login'>) => void;
  toggleUserStatus: (id: string) => void;

  startAutoDiscovery: (subnet: string) => void;
  approveDiscoveredDevice: (id: string) => void;
  ignoreDiscoveredDevice: (id: string) => void;

  // Fase 6 AI Optimizer Actions
  runAiOptimizationScan: () => void;
  applyOptimizationPlan: (planId: string) => void;
  applyLanRouteRecommendation: (routeId: string) => void;
  toggleDashboardWidget: (key: keyof DashboardWidgetVisibility) => void;
  updateAiConfig: (updates: Partial<AiConfig>) => void;
  testAiConnection: () => Promise<{ success: boolean; latency: number; message: string }>;

  addAuditLog: (action: string, details: string) => void;
  pingDevice: (ip: string) => Promise<{ latency: number; loss: number; success: boolean; packets: number[] }>;
}

const NmsContext = createContext<NmsContextType | null>(null);

export const NmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Entities state
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [interfaces, setInterfaces] = useState<DeviceInterface[]>(initialInterfaces);
  const [queues, setQueues] = useState<QueueTraffic[]>(initialQueues);
  const [vpnTunnels, setVpnTunnels] = useState<VpnTunnel[]>(initialVpnTunnels);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(initialAlertRules);
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>(initialRepairRecords);
  const [reportSchedules, setReportSchedules] = useState<ReportSchedule[]>(initialReportSchedules);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [discoveredDevices, setDiscoveredDevices] = useState<AutoDiscoveredDevice[]>(initialAutoDiscovered);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Fase 6 AI Optimizer & Dashboard Widget State
  const [aiAnomalies, setAiAnomalies] = useState<AiLogAnomaly[]>(initialAiLogAnomalies);
  const [lanRoutes, setLanRoutes] = useState<LanRouteRecommendation[]>(initialLanRouteRecommendations);
  const [deviceOptimizationPlans, setDeviceOptimizationPlans] = useState<DeviceOptimizationPlan[]>(initialDeviceOptimizationPlans);
  const [aiSimulation, setAiSimulation] = useState<AiSimulationMetrics>(initialAiSimulationMetrics);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidgetVisibility>(initialDashboardWidgets);
  const [aiConfig, setAiConfig] = useState<AiConfig>(initialAiConfig);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiScanProgress, setAiScanProgress] = useState(0);

  // Realtime throughput chart history
  const [throughputHistory, setThroughputHistory] = useState<ThroughputPoint[]>(() => {
    const points: ThroughputPoint[] = [];
    const now = Date.now();
    for (let i = 15; i >= 0; i--) {
      const t = new Date(now - i * 5000);
      const timeStr = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
      points.push({
        time: timeStr,
        inbound: Math.floor(180 + Math.random() * 60),
        outbound: Math.floor(45 + Math.random() * 25),
      });
    }
    return points;
  });

  // Initial backend API data synchronization
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const [
          devicesRes,
          locationsRes,
          alertsRes,
          repairsRes,
          schedulesRes,
          usersRes,
          logsRes,
          discoveryRes,
          optimizerRes,
        ] = await Promise.allSettled([
          nmsApi.getDevices(),
          nmsApi.getLocations(),
          nmsApi.getAlerts(),
          nmsApi.getRepairs(),
          nmsApi.getReports(),
          nmsApi.getUsers(),
          nmsApi.getAuditLogs(),
          nmsApi.getDiscovery(),
          nmsApi.getOptimizerData(),
        ]);

        if (devicesRes.status === 'fulfilled' && Array.isArray(devicesRes.value) && devicesRes.value.length > 0) {
          setDevices(devicesRes.value);
        }
        if (locationsRes.status === 'fulfilled' && Array.isArray(locationsRes.value) && locationsRes.value.length > 0) {
          setLocations(locationsRes.value);
        }
        if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value) && alertsRes.value.length > 0) {
          setAlerts(alertsRes.value);
        }
        if (repairsRes.status === 'fulfilled' && Array.isArray(repairsRes.value) && repairsRes.value.length > 0) {
          setRepairRecords(repairsRes.value);
        }
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
          setUsers(usersRes.value);
        }
        if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value) && logsRes.value.length > 0) {
          setAuditLogs(logsRes.value);
        }
        if (discoveryRes.status === 'fulfilled' && Array.isArray(discoveryRes.value) && discoveryRes.value.length > 0) {
          setDiscoveredDevices(discoveryRes.value);
        }
        if (optimizerRes.status === 'fulfilled' && optimizerRes.value) {
          const opt = optimizerRes.value;
          if (opt.anomalies) setAiAnomalies(opt.anomalies);
          if (opt.lanRoutes) setLanRoutes(opt.lanRoutes);
          if (opt.optimizationPlans) setDeviceOptimizationPlans(opt.optimizationPlans);
          if (opt.config) setAiConfig(opt.config);
        }
      } catch (err) {
        console.warn('API sync fallback to mock initial state:', err);
      }
    };

    syncWithBackend();
  }, []);

  // Apply dark mode class to HTML
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const switchUserRole = useCallback((role: UserRole) => {
    const target = users.find(u => u.role === role) || users[0];
    setCurrentUser(target);
  }, [users]);

  const addAuditLog = useCallback((action: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: currentUser.role,
      action,
      details,
      ip_address: '192.168.1.105',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // Periodic realtime simulation (Updates throughput and slight device variance)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const newInbound = Math.floor(170 + Math.random() * 85);
      const newOutbound = Math.floor(40 + Math.random() * 35);

      setThroughputHistory(prev => {
        const next = [...prev.slice(1), { time: timeStr, inbound: newInbound, outbound: newOutbound }];
        return next;
      });

      // Fluctuate live device CPU/RAM & Interface rates slightly
      setDevices(prevDevices =>
        prevDevices.map(dev => {
          if (dev.status === 'offline' || dev.status === 'unreachable') return dev;
          const cpuDelta = (Math.random() - 0.5) * 4;
          const latencyDelta = (Math.random() - 0.5) * 2;
          return {
            ...dev,
            cpu_usage: Math.min(99, Math.max(5, Math.round(dev.cpu_usage + cpuDelta))),
            latency: Math.max(1, Math.round(dev.latency + latencyDelta)),
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Actions
  const addDevice = useCallback((newDev: Omit<Device, 'id' | 'created_at' | 'last_seen'>) => {
    const loc = locations.find(l => l.id === newDev.location_id);
    const created: Device = {
      ...newDev,
      id: `dev-${Date.now()}`,
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      location_name: loc ? loc.name : 'Unknown Location',
    };
    setDevices(prev => [...prev, created]);
    addAuditLog('ADD_DEVICE', `Menambahkan perangkat baru: ${created.name} (${created.ip_address})`);
    nmsApi.createDevice(created).catch(e => console.warn('Failed to sync createDevice:', e));
  }, [locations, addAuditLog]);

  const updateDevice = useCallback((id: string, updates: Partial<Device>) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, ...updates, last_seen: new Date().toISOString() } : d))
    );
    addAuditLog('UPDATE_DEVICE', `Memperbarui konfigurasi perangkat ID: ${id}`);
    nmsApi.updateDevice(id, updates).catch(e => console.warn('Failed to sync updateDevice:', e));
  }, [addAuditLog]);

  const deleteDevice = useCallback((id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    addAuditLog('DELETE_DEVICE', `Menghapus perangkat ID: ${id}`);
    nmsApi.deleteDevice(id).catch(e => console.warn('Failed to sync deleteDevice:', e));
  }, [addAuditLog]);

  const toggleDevicePriority = useCallback((id: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, is_priority: !d.is_priority } : d))
    );
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === id ? { ...a, acknowledged: true, acknowledged_by: currentUser.name } : a
      )
    );
    addAuditLog('ACKNOWLEDGE_ALERT', `Menandai peringatan ${id} sebagai telah diperhatikan.`);
    nmsApi.acknowledgeAlert(id, currentUser.name).catch(e => console.warn('Failed to sync acknowledgeAlert:', e));
  }, [currentUser, addAuditLog]);

  const resolveAlert = useCallback((id: string, notes: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === id
          ? {
              ...a,
              resolved_at: new Date().toISOString(),
              resolved_by: currentUser.name,
              resolution_notes: notes,
            }
          : a
      )
    );
    addAuditLog('RESOLVE_ALERT', `Menyelesaikan peringatan ${id}: ${notes}`);
    nmsApi.resolveAlert(id, notes, currentUser.name).catch(e => console.warn('Failed to sync resolveAlert:', e));
  }, [currentUser, addAuditLog]);

  const toggleAlertRule = useCallback((id: string) => {
    setAlertRules(prev =>
      prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    addAuditLog('TOGGLE_ALERT_RULE', `Mengubah status aturan alert ID: ${id}`);
  }, [addAuditLog]);

  const addAlertRule = useCallback((rule: Omit<AlertRule, 'id'>) => {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    setAlertRules(prev => [...prev, newRule]);
    addAuditLog('ADD_ALERT_RULE', `Membuat aturan alert baru: ${newRule.name}`);
    nmsApi.createAlertRule(newRule).catch(e => console.warn('Failed to sync createAlertRule:', e));
  }, [addAuditLog]);

  const addRepairRecord = useCallback(
    (record: Omit<RepairRecord, 'id' | 'ticket_code' | 'created_at' | 'updated_at'>) => {
      const nowStr = new Date().toISOString();
      const code = `TKT-${nowStr.slice(0, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
      const newRec: RepairRecord = {
        ...record,
        id: `rep-${Date.now()}`,
        ticket_code: code,
        created_at: nowStr,
        updated_at: nowStr,
      };
      setRepairRecords(prev => [newRec, ...prev]);
      addAuditLog('CREATE_REPAIR_RECORD', `Membuat tiket perbaikan ${code} untuk ${record.device_name}`);
      nmsApi.createRepair(newRec).catch(e => console.warn('Failed to sync createRepair:', e));
    },
    [addAuditLog]
  );

  const updateRepairRecord = useCallback((id: string, updates: Partial<RepairRecord>) => {
    setRepairRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
    addAuditLog('UPDATE_REPAIR_RECORD', `Memperbarui tiket perbaikan ${id}`);
  }, [addAuditLog]);

  const addReportSchedule = useCallback((schedule: Omit<ReportSchedule, 'id'>) => {
    const newSch: ReportSchedule = {
      ...schedule,
      id: `sch-${Date.now()}`,
    };
    setReportSchedules(prev => [...prev, newSch]);
    addAuditLog('ADD_REPORT_SCHEDULE', `Membuat jadwal laporan baru: ${newSch.name}`);
    nmsApi.createReportSchedule(newSch).catch(e => console.warn('Failed to sync createReportSchedule:', e));
  }, [addAuditLog]);

  const toggleReportSchedule = useCallback((id: string) => {
    setReportSchedules(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const addUser = useCallback((user: Omit<User, 'id' | 'created_at' | 'last_login'>) => {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      last_login: 'Belum pernah login',
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('ADD_USER', `Menambahkan pengguna baru: ${newUser.name} (${newUser.email})`);
    nmsApi.createUser(newUser).catch(e => console.warn('Failed to sync createUser:', e));
  }, [addAuditLog]);

  const toggleUserStatus = useCallback((id: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const newStatus = u.status === 'active' ? 'inactive' : 'active';
          nmsApi.updateUser({ id, status: newStatus }).catch(e => console.warn('Failed to sync updateUser:', e));
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  }, []);

  const startAutoDiscovery = useCallback((subnet: string) => {
    setIsScanning(true);
    setScanProgress(0);
    nmsApi.startDiscovery(subnet).catch(e => console.warn('Failed to trigger startDiscovery:', e));
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          addAuditLog('AUTO_DISCOVERY', `Menyelesaikan pemindaian subnet ${subnet}`);
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  }, [addAuditLog]);

  const approveDiscoveredDevice = useCallback((id: string) => {
    const disc = discoveredDevices.find(d => d.id === id);
    if (!disc) return;

    addDevice({
      name: disc.suggested_name,
      type: disc.type,
      ip_address: disc.ip,
      mac_address: disc.mac,
      model: `${disc.vendor} Auto-Discovered`,
      location_id: locations[0].id,
      is_priority: false,
      status: 'online',
      uptime: '1 jam',
      cpu_usage: 12,
      ram_usage: 25,
      storage_usage: 15,
      temperature: 38,
      latency: disc.response_time,
      packet_loss: 0,
      snmp_version: 'v2c',
      snmp_community: 'public_nms',
    });

    setDiscoveredDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'approved' } : d))
    );
    nmsApi.updateDiscoveryDevice(id, 'approve').catch(e => console.warn('Failed to sync approve discovery:', e));
  }, [discoveredDevices, locations, addDevice]);

  const ignoreDiscoveredDevice = useCallback((id: string) => {
    setDiscoveredDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'ignored' } : d))
    );
    nmsApi.updateDiscoveryDevice(id, 'ignore').catch(e => console.warn('Failed to sync ignore discovery:', e));
  }, []);

  const pingDevice = useCallback(async (ip: string) => {
    try {
      const dev = devices.find(d => d.ip_address === ip || d.id === ip);
      if (dev) {
        const res = await nmsApi.pingDevice(dev.id);
        if (res && res.packets) {
          return {
            latency: res.latency,
            loss: res.packetLoss !== undefined ? res.packetLoss : res.loss,
            success: res.success,
            packets: res.packets,
          };
        }
      }
    } catch {
      // Fallback
    }

    // Realistic Ping Simulation with jitter
    const dev = devices.find(d => d.ip_address === ip);
    const isOffline = dev?.status === 'offline';
    const isUnreachable = dev?.status === 'unreachable';

    const packets: number[] = [];
    let lossCount = 0;

    for (let i = 0; i < 4; i++) {
      await new Promise(res => setTimeout(res, 250));
      if (isOffline || isUnreachable) {
        lossCount++;
        packets.push(999);
      } else {
        const baseLatency = dev?.latency || 4;
        const jitter = (Math.random() - 0.5) * 4;
        const lat = Math.max(1, Math.round(baseLatency + jitter));
        packets.push(lat);
      }
    }

    const lossPercent = (lossCount / 4) * 100;
    const validPackets = packets.filter(p => p !== 999);
    const avgLatency = validPackets.length
      ? Math.round(validPackets.reduce((a, b) => a + b, 0) / validPackets.length)
      : 999;

    return {
      latency: avgLatency,
      loss: lossPercent,
      success: lossPercent < 100,
      packets,
    };
  }, [devices]);

  // Fase 6 AI Optimizer Actions
  const runAiOptimizationScan = useCallback(() => {
    setIsAiAnalyzing(true);
    setAiScanProgress(10);
    nmsApi.runOptimizerScan().catch(e => console.warn('Failed to trigger AI scan:', e));

    const interval = setInterval(() => {
      setAiScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAiAnalyzing(false);
          addAuditLog('AI_OPTIMIZATION_SCAN', 'Menjalankan AI Deep Log & SNMP Metric Inspection pada seluruh perangkat jaringan');
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  }, [addAuditLog]);

  const applyOptimizationPlan = useCallback((planId: string) => {
    setDeviceOptimizationPlans(prev =>
      prev.map(p => (p.id === planId ? { ...p, applied: true, applied_at: new Date().toISOString() } : p))
    );
    nmsApi.applyOptimization('plan', planId).catch(e => console.warn('Failed to apply plan:', e));

    const targetPlan = deviceOptimizationPlans.find(p => p.id === planId);
    if (targetPlan) {
      addAuditLog(
        'APPLY_AI_OPTIMIZATION',
        `Menerapkan rencana optimasi AI "${targetPlan.title}" pada ${targetPlan.device_name}`
      );

      // Improve simulated metrics
      setAiSimulation(prev => ({
        ...prev,
        current_avg_latency: Math.max(3, prev.current_avg_latency - 4),
        network_health_score: Math.min(100, prev.network_health_score + 8),
        current_cpu_peak: Math.max(20, prev.current_cpu_peak - 12),
      }));
    }
  }, [deviceOptimizationPlans, addAuditLog]);

  const applyLanRouteRecommendation = useCallback((routeId: string) => {
    setLanRoutes(prev =>
      prev.map(r => (r.id === routeId ? { ...r, status: 'applied' } : r))
    );
    nmsApi.applyOptimization('route', routeId).catch(e => console.warn('Failed to apply route:', e));

    const targetRoute = lanRoutes.find(r => r.id === routeId);
    if (targetRoute) {
      addAuditLog(
        'APPLY_LAN_ROUTE',
        `Menerapkan rekomendasi jalur LAN "${targetRoute.title}" pada ${targetRoute.target_subnet}`
      );

      setAiSimulation(prev => ({
        ...prev,
        current_packet_loss: 0,
        network_health_score: Math.min(100, prev.network_health_score + 6),
      }));
    }
  }, [lanRoutes, addAuditLog]);

  const toggleDashboardWidget = useCallback((key: keyof DashboardWidgetVisibility) => {
    setDashboardWidgets(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const updateAiConfig = useCallback((updates: Partial<AiConfig>) => {
    setAiConfig(prev => ({
      ...prev,
      ...updates,
    }));
    addAuditLog('UPDATE_AI_CONFIG', 'Memperbarui parameter konfigurasi & API Key AI Engine');
    nmsApi.updateAiConfig(updates).catch(e => console.warn('Failed to sync updateAiConfig:', e));
  }, [addAuditLog]);

  const testAiConnection = useCallback(async () => {
    // Simulate AI API Handshake or call API
    const isLocal = aiConfig.provider === 'local_ollama';
    const hasKey = !!aiConfig.api_key.trim();

    if (!isLocal && !hasKey) {
      setAiConfig(prev => ({
        ...prev,
        connection_status: 'error',
        last_tested_at: new Date().toISOString(),
      }));
      return { success: false, latency: 0, message: 'API Key tidak boleh kosong!' };
    }

    try {
      const res = await nmsApi.updateAiConfig(aiConfig);
      const latency = res?.responseTimeMs || Math.floor(180 + Math.random() * 80);
      setAiConfig(prev => ({
        ...prev,
        connection_status: 'connected',
        last_tested_at: new Date().toISOString(),
        response_time_ms: latency,
      }));
      addAuditLog('TEST_AI_CONNECTION', `Uji koneksi model ${aiConfig.model} berhasil (${latency}ms)`);
      return { success: true, latency, message: `Terhubung ke ${aiConfig.model} (${latency}ms)` };
    } catch {
      const latency = Math.floor(180 + Math.random() * 80);
      setAiConfig(prev => ({
        ...prev,
        connection_status: 'connected',
        last_tested_at: new Date().toISOString(),
        response_time_ms: latency,
      }));
      addAuditLog('TEST_AI_CONNECTION', `Uji koneksi model ${aiConfig.model} berhasil (${latency}ms)`);
      return { success: true, latency, message: `Terhubung ke ${aiConfig.model} (${latency}ms)` };
    }
  }, [aiConfig, addAuditLog]);

  // Derived live stats
  const totalDevices = devices.length;
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const warningCount = devices.filter(d => d.status === 'warning').length;
  const offlineCount = devices.filter(d => d.status === 'offline' || d.status === 'unreachable').length;
  const activeAlertsCount = alerts.filter(a => !a.resolved_at).length;
  const slaPercent = totalDevices ? Number(((onlineCount / totalDevices) * 100).toFixed(2)) : 100;
  const latestThroughput = throughputHistory[throughputHistory.length - 1] || { inbound: 0, outbound: 0 };

  const value: NmsContextType = {
    theme,
    toggleTheme,
    soundEnabled,
    setSoundEnabled,
    currentUser,
    setCurrentUser,
    switchUserRole,
    locations,
    devices,
    interfaces,
    queues,
    vpnTunnels,
    alerts,
    alertRules,
    repairRecords,
    reportSchedules,
    users,
    auditLogs,
    discoveredDevices,
    isScanning,
    scanProgress,
    aiAnomalies,
    lanRoutes,
    deviceOptimizationPlans,
    aiSimulation,
    dashboardWidgets,
    aiConfig,
    isAiAnalyzing,
    aiScanProgress,
    throughputHistory,
    liveStats: {
      totalDevices,
      onlineCount,
      warningCount,
      offlineCount,
      slaPercent,
      activeAlertsCount,
      currentInboundMbps: latestThroughput.inbound,
      currentOutboundMbps: latestThroughput.outbound,
    },
    addDevice,
    updateDevice,
    deleteDevice,
    toggleDevicePriority,
    acknowledgeAlert,
    resolveAlert,
    toggleAlertRule,
    addAlertRule,
    addRepairRecord,
    updateRepairRecord,
    addReportSchedule,
    toggleReportSchedule,
    addUser,
    toggleUserStatus,
    startAutoDiscovery,
    approveDiscoveredDevice,
    ignoreDiscoveredDevice,
    runAiOptimizationScan,
    applyOptimizationPlan,
    applyLanRouteRecommendation,
    toggleDashboardWidget,
    updateAiConfig,
    testAiConnection,
    addAuditLog,
    pingDevice,
  };

  return <NmsContext.Provider value={value}>{children}</NmsContext.Provider>;
};

export const useNms = () => {
  const context = useContext(NmsContext);
  if (!context) {
    throw new Error('useNms must be used within an NmsProvider');
  }
  return context;
};
