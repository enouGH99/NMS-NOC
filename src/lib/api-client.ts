/**
 * Type-safe API Client for NMS Next.js Backend Routes
 */

export async function fetchApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const nmsApi = {
  getStats: () => fetchApi('/api/stats'),
  getDevices: (params?: { locationId?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi(`/api/devices${query ? `?${query}` : ''}`);
  },
  getDevice: (id: string) => fetchApi(`/api/devices/${id}`),
  createDevice: (data: any) => fetchApi('/api/devices', { method: 'POST', body: JSON.stringify(data) }),
  updateDevice: (id: string, data: any) => fetchApi(`/api/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevice: (id: string) => fetchApi(`/api/devices/${id}`, { method: 'DELETE' }),
  pingDevice: (id: string) => fetchApi(`/api/devices/${id}/ping`, { method: 'POST' }),
  syncDeviceSnmp: (id: string, data?: any) => fetchApi(`/api/devices/${id}/snmp-sync`, { method: 'POST', body: JSON.stringify(data || {}) }),
  testSnmp: (data: any) => fetchApi('/api/devices/snmp-test', { method: 'POST', body: JSON.stringify(data) }),

  getLocations: () => fetchApi('/api/locations'),
  createLocation: (data: any) => fetchApi('/api/locations', { method: 'POST', body: JSON.stringify(data) }),

  getAlerts: (activeOnly?: boolean) => fetchApi(`/api/alerts${activeOnly ? '?activeOnly=true' : ''}`),
  createAlert: (data: any) => fetchApi('/api/alerts', { method: 'POST', body: JSON.stringify(data) }),
  acknowledgeAlert: (id: string, userName?: string) =>
    fetchApi(`/api/alerts/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ userName }) }),
  resolveAlert: (id: string, notes?: string, userName?: string) =>
    fetchApi(`/api/alerts/${id}/resolve`, { method: 'POST', body: JSON.stringify({ notes, userName }) }),

  getAlertRules: () => fetchApi('/api/alert-rules'),
  createAlertRule: (data: any) => fetchApi('/api/alert-rules', { method: 'POST', body: JSON.stringify(data) }),

  getRepairs: () => fetchApi('/api/repairs'),
  createRepair: (data: any) => fetchApi('/api/repairs', { method: 'POST', body: JSON.stringify(data) }),

  getReports: () => fetchApi('/api/reports'),
  createReportSchedule: (data: any) => fetchApi('/api/reports', { method: 'POST', body: JSON.stringify(data) }),

  getTopology: () => fetchApi('/api/topology'),

  getDiscovery: () => fetchApi('/api/discovery'),
  startDiscovery: (subnet: string) => fetchApi('/api/discovery', { method: 'POST', body: JSON.stringify({ subnet }) }),
  updateDiscoveryDevice: (id: string, action: 'approve' | 'ignore') =>
    fetchApi('/api/discovery', { method: 'PUT', body: JSON.stringify({ id, action }) }),

  getQueues: (deviceId?: string) => fetchApi(`/api/queues${deviceId ? `?deviceId=${deviceId}` : ''}`),
  createQueue: (data: any) => fetchApi('/api/queues', { method: 'POST', body: JSON.stringify(data) }),

  getInterfaces: (deviceId?: string) => fetchApi(`/api/interfaces${deviceId ? `?deviceId=${deviceId}` : ''}`),
  createInterface: (data: any) => fetchApi('/api/interfaces', { method: 'POST', body: JSON.stringify(data) }),

  getUsers: () => fetchApi('/api/users'),
  createUser: (data: any) => fetchApi('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (data: any) => fetchApi('/api/users', { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => fetchApi(`/api/users?id=${id}`, { method: 'DELETE' }),

  getAuditLogs: () => fetchApi('/api/audit-logs'),
  createAuditLog: (data: any) => fetchApi('/api/audit-logs', { method: 'POST', body: JSON.stringify(data) }),

  getOptimizerData: () => fetchApi('/api/optimizer'),
  runOptimizerScan: () => fetchApi('/api/optimizer', { method: 'POST' }),
  applyOptimization: (type: 'route' | 'plan', id: string) =>
    fetchApi('/api/optimizer/apply', { method: 'POST', body: JSON.stringify({ type, id }) }),
  getAiConfig: () => fetchApi('/api/optimizer/config'),
  updateAiConfig: (data: any) => fetchApi('/api/optimizer/config', { method: 'PUT', body: JSON.stringify(data) }),
};
