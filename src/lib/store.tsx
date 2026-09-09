'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Device,
  DeviceStatus,
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
  DashboardWidgetVisibility,
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
  initialDashboardWidgets,
  generateDefaultInterfaces,
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
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (user: User) => void;
  loginAs: (role: UserRole, email?: string) => void;
  logout: () => void;

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

  dashboardWidgets: DashboardWidgetVisibility;

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
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

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

  toggleDashboardWidget: (key: keyof DashboardWidgetVisibility) => void;

  addAuditLog: (action: string, details: string) => void;
  pingDevice: (ip: string) => Promise<{ latency: number; loss: number; success: boolean; packets: number[] }>;
  syncQueues: (deviceId?: string) => Promise<void>;
  addQueue: (queue: any) => void;
  syncInterfaces: (deviceId?: string) => Promise<void>;
  addInterface: (iface: any) => void;
  updateInterface: (id: string, updates: Partial<DeviceInterface>) => void;
  updateAllInterfaceSpeeds: (deviceId: string, speed: string) => void;
  syncDeviceViaSnmp: (deviceId: string) => Promise<{ success: boolean; data?: any; error?: string; cliHelp?: string }>;
  testSnmpConnection: (config: any) => Promise<{ success: boolean; data?: any; error?: string; cliHelp?: string }>;
}

const NmsContext = createContext<NmsContextType | null>(null);

const defaultAdminUser: User = {
  id: 'usr-admin',
  name: 'Dimas (Admin)',
  email: 'admin@kantor.go.id',
  role: 'admin',
  status: 'active',
  last_login: 'Belum pernah login',
  created_at: new Date().toISOString(),
};

export const NmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Entities state - Clean initial states (connected to PostgreSQL)
  const [locations, setLocations] = useState<Location[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nms_locations');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialLocations;
  });
  const [devices, setDevices] = useState<Device[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nms_devices');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [interfaces, setInterfaces] = useState<DeviceInterface[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nms_interfaces');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialInterfaces;
  });
  const [queues, setQueues] = useState<QueueTraffic[]>([]);
  const [vpnTunnels, setVpnTunnels] = useState<VpnTunnel[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>([]);
  const [reportSchedules, setReportSchedules] = useState<ReportSchedule[]>([]);
  const [users, setUsers] = useState<User[]>([defaultAdminUser]);
  const [currentUser, setCurrentUser] = useState<User>(defaultAdminUser);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<AutoDiscoveredDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidgetVisibility>(initialDashboardWidgets);

  // Check auth session on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('nms_auth_user');
        const hasSessionCookie = document.cookie.includes('nms_auth_session=1');
        if (savedUser && hasSessionCookie) {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          setIsAuthenticated(true);
        } else if (hasSessionCookie) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('Failed to parse auth user session:', err);
        setIsAuthenticated(false);
      } finally {
        setIsAuthLoading(false);
      }
    }
  }, []);

  // Realtime throughput chart history (Starts clean at 0 Mbps)
  const [throughputHistory, setThroughputHistory] = useState<ThroughputPoint[]>(() => {
    const points: ThroughputPoint[] = [];
    const now = Date.now();
    for (let i = 15; i >= 0; i--) {
      const t = new Date(now - i * 5000);
      const timeStr = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
      points.push({
        time: timeStr,
        inbound: 0,
        outbound: 0,
      });
    }
    return points;
  });

  // Initial backend API data synchronization with PostgreSQL
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
          alertRulesRes,
          queuesRes,
          interfacesRes,
        ] = await Promise.allSettled([
          nmsApi.getDevices(),
          nmsApi.getLocations(),
          nmsApi.getAlerts(),
          nmsApi.getRepairs(),
          nmsApi.getReports(),
          nmsApi.getUsers(),
          nmsApi.getAuditLogs(),
          nmsApi.getDiscovery(),
          nmsApi.getAlertRules(),
          nmsApi.getQueues(),
          nmsApi.getInterfaces(),
        ]);

        let loadedDevices: Device[] = [];
        if (devicesRes.status === 'fulfilled' && Array.isArray(devicesRes.value)) {
          loadedDevices = devicesRes.value;
          setDevices(devicesRes.value);
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('nms_devices', JSON.stringify(devicesRes.value)); } catch {}
          }
        }

        if (locationsRes.status === 'fulfilled' && Array.isArray(locationsRes.value) && locationsRes.value.length > 0) {
          setLocations(locationsRes.value);
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('nms_locations', JSON.stringify(locationsRes.value)); } catch {}
          }
        } else if (locations.length === 0) {
          setLocations(initialLocations);
        }
        if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)) {
          setAlerts(alertsRes.value);
        }
        if (repairsRes.status === 'fulfilled' && Array.isArray(repairsRes.value)) {
          setRepairRecords(repairsRes.value);
        }
        if (schedulesRes.status === 'fulfilled' && schedulesRes.value) {
          const sch = Array.isArray(schedulesRes.value) ? schedulesRes.value : schedulesRes.value.schedules;
          if (Array.isArray(sch)) {
            setReportSchedules(sch);
          }
        }
        if (alertRulesRes.status === 'fulfilled' && Array.isArray(alertRulesRes.value)) {
          setAlertRules(alertRulesRes.value);
        }
        if (queuesRes.status === 'fulfilled' && Array.isArray(queuesRes.value)) {
          setQueues(queuesRes.value);
        }
        if (interfacesRes.status === 'fulfilled' && Array.isArray(interfacesRes.value)) {
          setInterfaces(interfacesRes.value);
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('nms_interfaces', JSON.stringify(interfacesRes.value)); } catch {}
          }
        }
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
          setUsers(usersRes.value);
          // Only update currentUser if not already set from session
          const savedUser = typeof window !== 'undefined' ? localStorage.getItem('nms_auth_user') : null;
          if (!savedUser) {
            setCurrentUser(usersRes.value[0]);
          }
        }
        if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)) {
          setAuditLogs(logsRes.value);
        }
        if (discoveryRes.status === 'fulfilled' && Array.isArray(discoveryRes.value)) {
          setDiscoveredDevices(discoveryRes.value);
        }
      } catch (err) {
        console.warn('API sync fallback to clean initial state:', err);
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

  const login = useCallback((userToLogin: User) => {
    setCurrentUser(userToLogin);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nms_auth_user', JSON.stringify(userToLogin));
      document.cookie = 'nms_auth_session=1; path=/; max-age=604800; SameSite=Lax';
    }
  }, []);

  const loginAs = useCallback((role: UserRole, email?: string) => {
    let target = users.find(u => u.role === role);
    if (!target) {
      target = {
        id: role === 'admin' ? 'usr-admin' : 'usr-petugas',
        name: role === 'admin' ? 'Budi Santoso, S.Kom' : 'Dimas Prakoso',
        email: email || (role === 'admin' ? 'admin@kantor.go.id' : 'dimas@kantor.go.id'),
        role,
        status: 'active',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }
    login(target);
  }, [users, login]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nms_auth_user');
      document.cookie = 'nms_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
  }, []);

  const switchUserRole = useCallback((role: UserRole) => {
    const target = users.find(u => u.role === role) || {
      id: role === 'admin' ? 'usr-admin' : 'usr-petugas',
      name: role === 'admin' ? 'Budi Santoso, S.Kom' : 'Dimas Prakoso',
      email: role === 'admin' ? 'admin@kantor.go.id' : 'dimas@kantor.go.id',
      role,
      status: 'active',
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setCurrentUser(target);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nms_auth_user', JSON.stringify(target));
    }
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

  // Periodic realtime loop (Generates throughput purely based on active registered online devices)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      setDevices(prevDevices => {
        const onlineCount = prevDevices.filter(d => d.status === 'online').length;

        let newInbound = 0;
        let newOutbound = 0;

        if (onlineCount > 0) {
          const baseIn = onlineCount * 30;
          const baseOut = onlineCount * 10;
          newInbound = Math.max(1, Math.floor(baseIn + (Math.random() - 0.5) * 12));
          newOutbound = Math.max(1, Math.floor(baseOut + (Math.random() - 0.5) * 5));
        }

        setThroughputHistory(prev => {
          const next = [...prev.slice(1), { time: timeStr, inbound: newInbound, outbound: newOutbound }];
          return next;
        });

        if (prevDevices.length === 0) return prevDevices;

        return prevDevices.map(dev => {
          if (dev.status === 'offline' || dev.status === 'unreachable') return dev;
          const cpuDelta = (Math.random() - 0.5) * 2;
          const latencyDelta = (Math.random() - 0.5) * 1;
          return {
            ...dev,
            cpu_usage: Math.min(99, Math.max(5, Math.round(dev.cpu_usage + cpuDelta))),
            latency: Math.max(1, Math.round(dev.latency + latencyDelta)),
          };
        });
      });

      // Fluctuate live queues rate slightly if queues exist
      setQueues(prevQueues => {
        if (prevQueues.length === 0) return prevQueues;
        return prevQueues.map(q => {
          const maxParts = q.max_limit.split('/');
          const maxUl = parseInt(maxParts[0], 10) || 20;
          const maxDl = parseInt(maxParts[1] || maxParts[0], 10) || 20;
          const dlJitter = (Math.random() - 0.5) * 1.5;
          const ulJitter = (Math.random() - 0.5) * 0.5;
          const dl = Math.max(0.1, Number(((maxDl * 0.28) + dlJitter).toFixed(1)));
          const ul = Math.max(0.05, Number(((maxUl * 0.12) + ulJitter).toFixed(1)));
          return {
            ...q,
            current_rate: {
              download: dl,
              upload: ul,
            },
          };
        });
      });

      // Fluctuate live interfaces RX/TX rate slightly for online devices
      setInterfaces(prevIfaces => {
        if (prevIfaces.length === 0) return prevIfaces;
        return prevIfaces.map(iface => {
          if (iface.status === 'down') return iface;
          const rxJitter = (Math.random() - 0.5) * 4;
          const txJitter = (Math.random() - 0.5) * 2;
          const newRx = Math.max(0.1, Number((iface.rx_rate + rxJitter).toFixed(1)));
          const newTx = Math.max(0.1, Number((iface.tx_rate + txJitter).toFixed(1)));
          return {
            ...iface,
            rx_rate: newRx,
            tx_rate: newTx,
            rx_bytes: iface.rx_bytes + Math.round(newRx * 125000),
            tx_bytes: iface.tx_bytes + Math.round(newTx * 125000),
          };
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Actions
  const syncInterfaces = useCallback(async (deviceId?: string) => {
    try {
      const res: any = await nmsApi.getInterfaces(deviceId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (list.length > 0) {
        setInterfaces(prev => {
          const others = deviceId ? prev.filter(i => i.device_id !== deviceId) : [];
          const merged = [...others, ...list];
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('nms_interfaces', JSON.stringify(merged)); } catch {}
          }
          return merged;
        });
      }
      addAuditLog('SYNC_INTERFACES', 'Menyinkronkan daftar port interface dari perangkat');
    } catch (err) {
      console.warn('Failed to sync interfaces:', err);
    }
  }, [addAuditLog]);

  const addInterface = useCallback((ifaceData: any) => {
    const created: DeviceInterface = {
      id: ifaceData.id || `if-${Date.now()}`,
      device_id: ifaceData.device_id || (devices[0]?.id || 'dev-1'),
      name: ifaceData.name || 'ether-port',
      type: ifaceData.type || 'ethernet',
      status: ifaceData.status || 'up',
      mac_address: ifaceData.mac_address || '00:00:00:00:00:00',
      speed: ifaceData.speed || '1 Gbps',
      rx_rate: ifaceData.rx_rate || 10.0,
      tx_rate: ifaceData.tx_rate || 5.0,
      rx_bytes: ifaceData.rx_bytes || 1000000,
      tx_bytes: ifaceData.tx_bytes || 500000,
      error_rate: ifaceData.error_rate || 0,
    };
    setInterfaces(prev => {
      const updated = [...prev, created];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_interfaces', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    nmsApi.createInterface(created).catch(e => console.warn('Failed to persist createInterface:', e));
    addAuditLog('ADD_INTERFACE', `Menambahkan interface baru: ${created.name}`);
  }, [devices, addAuditLog]);

  const updateInterface = useCallback((id: string, updates: Partial<DeviceInterface>) => {
    setInterfaces(prev => {
      const updated = prev.map(i => (i.id === id ? { ...i, ...updates } : i));
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_interfaces', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    addAuditLog('UPDATE_INTERFACE', `Memperbarui konfigurasi port interface: ${id}`);
  }, [addAuditLog]);

  const updateAllInterfaceSpeeds = useCallback((deviceId: string, speed: string) => {
    setInterfaces(prev => {
      const updated = prev.map(i => {
        if (i.device_id === deviceId && i.type === 'ethernet') {
          return { ...i, speed };
        }
        return i;
      });
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_interfaces', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    addAuditLog('UPDATE_INTERFACE_SPEEDS', `Mengubah kecepatan port default untuk perangkat ${deviceId} menjadi ${speed}`);
  }, [addAuditLog]);

  const syncDeviceViaSnmp = useCallback(async (deviceId: string) => {
    try {
      const dev = devices.find(d => d.id === deviceId);
      const res: any = await nmsApi.syncDeviceSnmp(deviceId, dev ? {
        ip_address: dev.ip_address,
        snmp_version: dev.snmp_version,
        snmp_community: dev.snmp_community,
        snmp_v3: dev.snmp_v3,
      } : {});

      if (res && res.success && res.data) {
        const { system, interfaces: realInterfaces, queues: realQueues, latencyMs } = res.data;

        // 1. Update device in state
        if (system) {
          setDevices(prev => {
            const updated = prev.map(d =>
              d.id === deviceId
                ? {
                    ...d,
                    cpu_usage: system.cpuUsage,
                    ram_usage: system.ramUsage,
                    storage_usage: system.storageUsage,
                    temperature: system.temperature,
                    uptime: system.sysUpTime,
                    voltage: system.voltage,
                    latency: latencyMs || d.latency,
                    status: 'online' as DeviceStatus,
                    last_seen: new Date().toISOString(),
                  }
                : d
            );
            if (typeof window !== 'undefined') {
              try { localStorage.setItem('nms_devices', JSON.stringify(updated)); } catch {}
            }
            return updated;
          });
        }

        // 2. Update interfaces in state
        if (Array.isArray(realInterfaces) && realInterfaces.length > 0) {
          setInterfaces(prev => {
            const others = prev.filter(i => i.device_id !== deviceId);
            const merged = [...others, ...realInterfaces];
            if (typeof window !== 'undefined') {
              try { localStorage.setItem('nms_interfaces', JSON.stringify(merged)); } catch {}
            }
            return merged;
          });
        }

        // 3. Update queues if any
        if (Array.isArray(realQueues) && realQueues.length > 0) {
          setQueues(prev => {
            const others = prev.filter(q => q.device_id !== deviceId);
            return [...others, ...realQueues];
          });
        }

        addAuditLog(
          'SNMP_SYNC_SUCCESS',
          `Berhasil membaca metrik asli MikroTik via SNMP (${dev?.name || deviceId} - ${latencyMs} ms)`
        );

        return { success: true, data: res.data };
      }

      addAuditLog(
        'SNMP_SYNC_FAILED',
        `Gagal membaca SNMP untuk ${dev?.name || deviceId}: ${res?.error || 'Port 161 Timeout'}`
      );

      return {
        success: false,
        error: res?.error || 'SNMP Port 161 tidak merespon.',
        cliHelp: res?.cliHelp,
        data: res?.data,
      };
    } catch (err: any) {
      console.warn('SNMP sync error:', err);
      return {
        success: false,
        error: err.message || 'Terjadi kesalahan saat mengeksekusi polling SNMP',
      };
    }
  }, [devices, addAuditLog]);

  const testSnmpConnection = useCallback(async (config: any) => {
    try {
      const res: any = await nmsApi.testSnmp(config);
      return res;
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal terhubung ke SNMP port 161' };
    }
  }, []);

  const syncQueues = useCallback(async (deviceId?: string) => {
    try {
      const res: any = await nmsApi.getQueues(deviceId);
      if (Array.isArray(res)) {
        setQueues(res);
      } else if (res && Array.isArray(res.data)) {
        setQueues(res.data);
      }
      addAuditLog('SYNC_QUEUES', 'Menyinkronkan daftar Simple Queue dari MikroTik');
    } catch (err) {
      console.warn('Failed to sync queues:', err);
    }
  }, [addAuditLog]);

  const addQueue = useCallback((qData: any) => {
    const created: QueueTraffic = {
      id: qData.id || `q-${Date.now()}`,
      device_id: qData.device_id || (devices[0]?.id || 'dev-1'),
      name: qData.name,
      target: qData.target || '0.0.0.0/0',
      max_limit: qData.max_limit || '20M/20M',
      current_rate: qData.current_rate || { upload: 0.5, download: 2.5 },
      packet_rate: 120,
      dropped: 0,
    };
    setQueues(prev => [created, ...prev]);
    nmsApi.createQueue(created).catch(e => console.warn('Failed to persist createQueue:', e));
    addAuditLog('ADD_QUEUE', `Menambahkan Simple Queue: ${created.name} (${created.target})`);
  }, [devices, addAuditLog]);

  const addLocation = useCallback((locationData: Omit<Location, 'id'>) => {
    const newLocation: Location = {
      ...locationData,
      id: `loc-${Date.now()}`,
      device_count: 0,
    };
    setLocations(prev => {
      const updated = [...prev, newLocation];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_locations', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    nmsApi.createLocation(newLocation).catch(e => console.warn('Failed to persist location:', e));
    addAuditLog('ADD_LOCATION', `Menambahkan lokasi gedung baru: ${newLocation.name} (${newLocation.building})`);
  }, [addAuditLog]);

  const updateLocation = useCallback((id: string, updates: Partial<Location>) => {
    setLocations(prev => {
      const updated = prev.map(l => (l.id === id ? { ...l, ...updates } : l));
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_locations', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    addAuditLog('UPDATE_LOCATION', `Memperbarui data lokasi gedung ID: ${id}`);
  }, [addAuditLog]);

  const deleteLocation = useCallback((id: string) => {
    setLocations(prev => {
      const updated = prev.filter(l => l.id !== id);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_locations', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    addAuditLog('DELETE_LOCATION', `Menghapus lokasi gedung ID: ${id}`);
  }, [addAuditLog]);

  const addDevice = useCallback((newDev: Omit<Device, 'id' | 'created_at' | 'last_seen'>) => {
    const loc = locations.find(l => l.id === newDev.location_id);
    const created: Device = {
      ...newDev,
      id: `dev-${Date.now()}`,
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      location_name: loc ? loc.name : 'Unknown Location',
    };
    setDevices(prev => {
      const updated = [...prev, created];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_devices', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });

    // Automatically generate and register default interface ports for the new device
    const newIfaces = generateDefaultInterfaces(created.id, created.type, created.mac_address, created.name);
    setInterfaces(prev => {
      const updated = [...prev, ...newIfaces];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_interfaces', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });

    addAuditLog('ADD_DEVICE', `Menambahkan perangkat baru: ${created.name} (${created.ip_address})`);
    nmsApi.createDevice(created).then(() => {
      syncQueues(created.id);
      syncInterfaces(created.id);
    }).catch(e => console.warn('Failed to sync createDevice:', e));
  }, [locations, addAuditLog, syncQueues, syncInterfaces]);

  const updateDevice = useCallback((id: string, updates: Partial<Device>) => {
    setDevices(prev => {
      const updated = prev.map(d => (d.id === id ? { ...d, ...updates, last_seen: new Date().toISOString() } : d));
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_devices', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    addAuditLog('UPDATE_DEVICE', `Memperbarui konfigurasi perangkat ID: ${id}`);
    nmsApi.updateDevice(id, updates).catch(e => console.warn('Failed to sync updateDevice:', e));
  }, [addAuditLog]);

  const deleteDevice = useCallback((id: string) => {
    setDevices(prev => {
      const updated = prev.filter(d => d.id !== id);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_devices', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    addAuditLog('DELETE_DEVICE', `Menghapus perangkat ID: ${id}`);
    nmsApi.deleteDevice(id).catch(e => console.warn('Failed to sync deleteDevice:', e));
  }, [addAuditLog]);

  const toggleDevicePriority = useCallback((id: string) => {
    setDevices(prev => {
      const updated = prev.map(d => (d.id === id ? { ...d, is_priority: !d.is_priority } : d));
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('nms_devices', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
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

  const toggleDashboardWidget = useCallback((key: keyof DashboardWidgetVisibility) => {
    setDashboardWidgets(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

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
    isAuthenticated,
    isAuthLoading,
    login,
    loginAs,
    logout,
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
    dashboardWidgets,
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
    addLocation,
    updateLocation,
    deleteLocation,
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
    toggleDashboardWidget,
    addAuditLog,
    pingDevice,
    syncQueues,
    addQueue,
    syncInterfaces,
    addInterface,
    updateInterface,
    updateAllInterfaceSpeeds,
    syncDeviceViaSnmp,
    testSnmpConnection,
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

