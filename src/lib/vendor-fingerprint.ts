import { DeviceType } from './types';

export interface VendorFingerprintResult {
  vendor: string;
  type: DeviceType;
  suggestedName: string;
  model?: string;
  snmpSuggested: boolean;
  categoryTag?: 'router' | 'switch' | 'access_point' | 'server' | 'cctv' | 'iot' | 'workstation' | 'mobile';
}

/**
 * Normalizes MAC address to uppercase colon-separated format (e.g., CC:2D:E0:11:22:33)
 */
export function normalizeMac(rawMac: string): string {
  if (!rawMac) return '';
  const clean = rawMac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length < 6) return rawMac.toUpperCase();
  const parts: string[] = [];
  for (let i = 0; i < clean.length && i < 12; i += 2) {
    parts.push(clean.substring(i, i + 2));
  }
  return parts.join(':');
}

/**
 * Database of known MAC OUIs and Vendor profiles
 */
const VENDOR_OUI_MAP: { prefix: string; vendor: string; type: DeviceType; defaultModel: string; tag: VendorFingerprintResult['categoryTag']; snmp: boolean }[] = [
  // 1. Ruijie Networks & Reyee
  { prefix: 'C8:CD:55', vendor: 'Ruijie Networks', type: 'switch', defaultModel: 'Ruijie Managed Switch (RG-ES208GC)', tag: 'switch', snmp: true },
  { prefix: '14:14:4B', vendor: 'Ruijie Networks', type: 'switch', defaultModel: 'Ruijie Managed PoE Switch (RG-ES226GC-P)', tag: 'switch', snmp: true },
  { prefix: '70:85:C2', vendor: 'Ruijie Networks', type: 'switch', defaultModel: 'Ruijie Smart Switch', tag: 'switch', snmp: true },
  { prefix: '58:69:6C', vendor: 'Ruijie Reyee', type: 'access_point', defaultModel: 'Ruijie Reyee Wi-Fi 6 AP (RG-RAP2260)', tag: 'access_point', snmp: true },
  { prefix: 'B4:8C:9D', vendor: 'Ruijie Reyee', type: 'access_point', defaultModel: 'Ruijie Reyee Ceiling AP', tag: 'access_point', snmp: true },
  { prefix: '98:4A:6B', vendor: 'Ruijie Reyee', type: 'access_point', defaultModel: 'Ruijie Reyee EW1200 AP', tag: 'access_point', snmp: true },
  { prefix: '00:70:85', vendor: 'Ruijie Networks', type: 'switch', defaultModel: 'Ruijie Core Switch', tag: 'switch', snmp: true },
  { prefix: '04:40:A9', vendor: 'Ruijie Reyee', type: 'access_point', defaultModel: 'Ruijie Reyee Wall AP', tag: 'access_point', snmp: true },
  { prefix: '20:F4:78', vendor: 'Ruijie Networks', type: 'switch', defaultModel: 'Ruijie Industrial Switch', tag: 'switch', snmp: true },
  { prefix: 'D8:B1:2A', vendor: 'Ruijie Reyee', type: 'access_point', defaultModel: 'Ruijie Reyee Mesh Router', tag: 'access_point', snmp: true },
  { prefix: '68:DD:B7', vendor: 'Ruijie Networks', type: 'switch', defaultModel: 'Ruijie Enterprise Switch', tag: 'switch', snmp: true },

  // 2. MikroTik
  { prefix: 'CC:2D:E0', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik RouterBOARD', tag: 'router', snmp: true },
  { prefix: '48:8F:5A', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik Cloud Core Router (CCR)', tag: 'router', snmp: true },
  { prefix: '6C:3B:6B', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik Cloud Router Switch (CRS)', tag: 'router', snmp: true },
  { prefix: 'B8:69:F4', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik hEX / RB750Gr3', tag: 'router', snmp: true },
  { prefix: '08:55:31', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik hAP ac / ax', tag: 'router', snmp: true },
  { prefix: 'D4:CA:6D', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik RouterBOARD RB3011/RB4011', tag: 'router', snmp: true },
  { prefix: 'E4:8D:8C', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik RB1100AHx4', tag: 'router', snmp: true },
  { prefix: '2C:C8:1B', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik Wireless Wire / SXT', tag: 'router', snmp: true },
  { prefix: '74:4D:28', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik Core Gateway', tag: 'router', snmp: true },
  { prefix: '18:FD:74', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik RouterBOARD', tag: 'router', snmp: true },
  { prefix: '00:0C:42', vendor: 'MikroTik', type: 'router', defaultModel: 'MikroTik RouterBOARD', tag: 'router', snmp: true },

  // 3. Cisco Systems
  { prefix: '00:1E:13', vendor: 'Cisco Systems', type: 'switch', defaultModel: 'Cisco Catalyst 2960 / 3560 Switch', tag: 'switch', snmp: true },
  { prefix: '00:26:0B', vendor: 'Cisco Systems', type: 'switch', defaultModel: 'Cisco Catalyst Managed Switch', tag: 'switch', snmp: true },
  { prefix: '00:00:0C', vendor: 'Cisco Systems', type: 'router', defaultModel: 'Cisco Enterprise Router', tag: 'router', snmp: true },
  { prefix: '00:01:42', vendor: 'Cisco Systems', type: 'switch', defaultModel: 'Cisco CBS Series Switch', tag: 'switch', snmp: true },
  { prefix: '00:1B:D4', vendor: 'Cisco Systems', type: 'switch', defaultModel: 'Cisco SG Series Gigabit Switch', tag: 'switch', snmp: true },
  { prefix: '54:A2:74', vendor: 'Cisco Systems', type: 'switch', defaultModel: 'Cisco Business Managed Switch', tag: 'switch', snmp: true },
  { prefix: '70:69:5A', vendor: 'Cisco Systems', type: 'access_point', defaultModel: 'Cisco Aironet Access Point', tag: 'access_point', snmp: true },

  // 4. Ubiquiti / UniFi
  { prefix: 'B4:FB:E4', vendor: 'Ubiquiti Networks', type: 'access_point', defaultModel: 'UniFi U6-Pro Access Point', tag: 'access_point', snmp: true },
  { prefix: 'F0:9F:C2', vendor: 'Ubiquiti Networks', type: 'access_point', defaultModel: 'UniFi AP-AC-Pro', tag: 'access_point', snmp: true },
  { prefix: '78:8A:20', vendor: 'Ubiquiti Networks', type: 'switch', defaultModel: 'UniFi Switch Pro PoE', tag: 'switch', snmp: true },
  { prefix: '00:27:22', vendor: 'Ubiquiti Networks', type: 'router', defaultModel: 'UniFi Dream Machine / EdgeRouter', tag: 'router', snmp: true },
  { prefix: 'DC:9F:DB', vendor: 'Ubiquiti Networks', type: 'access_point', defaultModel: 'UniFi U6-LR Long Range AP', tag: 'access_point', snmp: true },
  { prefix: '24:A4:3C', vendor: 'Ubiquiti Networks', type: 'access_point', defaultModel: 'UniFi NanoHD AP', tag: 'access_point', snmp: true },
  { prefix: '68:D7:9A', vendor: 'Ubiquiti Networks', type: 'switch', defaultModel: 'UniFi Switch 24 PoE', tag: 'switch', snmp: true },

  // 5. Virtualization & Servers (Proxmox, QEMU, VMware, Hyper-V)
  { prefix: '52:54:00', vendor: 'QEMU / Proxmox VE', type: 'server', defaultModel: 'Proxmox Virtual Machine / KVM Guest', tag: 'server', snmp: true },
  { prefix: 'BC:24:11', vendor: 'Proxmox Server', type: 'server', defaultModel: 'Proxmox VE Node Host', tag: 'server', snmp: true },
  { prefix: '00:15:5D', vendor: 'Microsoft Hyper-V', type: 'server', defaultModel: 'Hyper-V Virtual Server', tag: 'server', snmp: false },
  { prefix: '00:50:56', vendor: 'VMware ESXi', type: 'server', defaultModel: 'VMware Virtual Machine', tag: 'server', snmp: true },
  { prefix: '00:0C:29', vendor: 'VMware ESXi', type: 'server', defaultModel: 'VMware Workstation Guest', tag: 'server', snmp: true },
  { prefix: '00:16:3E', vendor: 'Xen Project', type: 'server', defaultModel: 'Xen Virtualized Server', tag: 'server', snmp: true },

  // 6. Enterprise Hardware Servers (Dell, HP/HPE, Supermicro)
  { prefix: '00:D8:61', vendor: 'Dell Technologies', type: 'server', defaultModel: 'Dell OptiPlex / Precision Workstation', tag: 'workstation', snmp: false },
  { prefix: '00:14:22', vendor: 'Dell Technologies', type: 'server', defaultModel: 'Dell PowerEdge Server (iDRAC)', tag: 'server', snmp: true },
  { prefix: '18:66:DA', vendor: 'Dell Technologies', type: 'server', defaultModel: 'Dell PowerEdge Rack Server', tag: 'server', snmp: true },
  { prefix: 'B8:2A:72', vendor: 'Dell Technologies', type: 'server', defaultModel: 'Dell Latitude / Workstation', tag: 'workstation', snmp: false },
  { prefix: 'F8:DB:88', vendor: 'Dell Technologies', type: 'server', defaultModel: 'Dell PowerEdge Server', tag: 'server', snmp: true },
  { prefix: '00:1E:0B', vendor: 'Hewlett Packard Enterprise', type: 'server', defaultModel: 'HPE ProLiant Server (iLO)', tag: 'server', snmp: true },
  { prefix: '3C:D9:2B', vendor: 'HP Inc.', type: 'server', defaultModel: 'HP EliteDesk Workstation', tag: 'workstation', snmp: false },
  { prefix: '00:25:90', vendor: 'Super Micro Computer', type: 'server', defaultModel: 'Supermicro Server (IPMI)', tag: 'server', snmp: true },

  // 7. Security Cameras & NVRs (Hikvision, Dahua, Uniview)
  { prefix: '44:19:B6', vendor: 'Hikvision Digital', type: 'server', defaultModel: 'Hikvision IP CCTV Camera', tag: 'cctv', snmp: false },
  { prefix: 'E4:54:E8', vendor: 'Hikvision Digital', type: 'server', defaultModel: 'Hikvision Dome / Bullet IP Camera', tag: 'cctv', snmp: false },
  { prefix: '3C:EF:8C', vendor: 'Hikvision Digital', type: 'server', defaultModel: 'Hikvision NVR / DVR Recorder', tag: 'cctv', snmp: true },
  { prefix: 'A0:BD:1D', vendor: 'Hikvision Digital', type: 'server', defaultModel: 'Hikvision Security Camera', tag: 'cctv', snmp: false },
  { prefix: 'BC:54:51', vendor: 'Dahua Technology', type: 'server', defaultModel: 'Dahua IP Surveillance Camera', tag: 'cctv', snmp: false },
  { prefix: '18:68:CB', vendor: 'Dahua Technology', type: 'server', defaultModel: 'Dahua NVR Security Station', tag: 'cctv', snmp: true },
  { prefix: '48:EA:63', vendor: 'Uniview Technologies', type: 'server', defaultModel: 'Uniview IP Camera', tag: 'cctv', snmp: false },

  // 8. IoT & Sundaya Custom Controllers
  { prefix: '14:98:77', vendor: 'Sundaya', type: 'server', defaultModel: 'Sundaya-Mini IoT Controller', tag: 'iot', snmp: false },
  { prefix: '24:6F:28', vendor: 'Espressif Inc.', type: 'server', defaultModel: 'ESP32 Smart Sensor Node', tag: 'iot', snmp: false },
  { prefix: '30:AE:A4', vendor: 'Espressif Inc.', type: 'server', defaultModel: 'ESP8266 / ESP32 IoT Module', tag: 'iot', snmp: false },
  { prefix: '84:F3:EB', vendor: 'Espressif Inc.', type: 'server', defaultModel: 'ESP32 Industrial Gateway', tag: 'iot', snmp: false },
  { prefix: 'C0:4E:30', vendor: 'e-linter Energy', type: 'server', defaultModel: 'e-linter Solar Datalogger', tag: 'iot', snmp: false },
  { prefix: 'D4:F9:8D', vendor: 'e-linter Energy', type: 'server', defaultModel: 'e-linter Wi-Fi Collector', tag: 'iot', snmp: false },

  // 9. TP-Link & D-Link
  { prefix: '5C:62:8B', vendor: 'TP-Link Technologies', type: 'access_point', defaultModel: 'TP-Link Archer C24 Router/AP', tag: 'access_point', snmp: false },
  { prefix: '50:D4:F7', vendor: 'TP-Link Technologies', type: 'access_point', defaultModel: 'TP-Link Omada Gigabit AP', tag: 'access_point', snmp: true },
  { prefix: '60:32:B1', vendor: 'TP-Link Technologies', type: 'switch', defaultModel: 'TP-Link Easy Smart Switch', tag: 'switch', snmp: true },
  { prefix: '98:DA:C4', vendor: 'TP-Link Technologies', type: 'access_point', defaultModel: 'TP-Link Deco Mesh Node', tag: 'access_point', snmp: false },
  { prefix: 'B0:95:75', vendor: 'TP-Link Technologies', type: 'access_point', defaultModel: 'TP-Link Wi-Fi Range Extender', tag: 'access_point', snmp: false },

  // 10. Synology & QNAP Network Attached Storage (NAS)
  { prefix: '00:11:32', vendor: 'Synology Inc.', type: 'server', defaultModel: 'Synology DiskStation NAS Server', tag: 'server', snmp: true },
  { prefix: '00:08:9B', vendor: 'QNAP Systems', type: 'server', defaultModel: 'QNAP Turbo NAS', tag: 'server', snmp: true },

  // 11. Workstation Desktop NICs (Realtek, Intel, Broadcom)
  { prefix: '00:E0:4C', vendor: 'Realtek Semiconductor', type: 'server', defaultModel: 'Realtek PCIe Gigabit LAN (PC)', tag: 'workstation', snmp: false },
  { prefix: '2C:FD:A1', vendor: 'Intel Corporation', type: 'server', defaultModel: 'Intel I219-V Ethernet Workstation', tag: 'workstation', snmp: false },
  { prefix: 'DC:E9:94', vendor: 'Intel Corporation', type: 'server', defaultModel: 'Intel Wi-Fi 6 AX200 Client', tag: 'workstation', snmp: false },
  { prefix: 'D0:39:57', vendor: 'Realtek Semiconductor', type: 'server', defaultModel: 'Office Desktop PC', tag: 'workstation', snmp: false },
  { prefix: 'DA:9D:CC', vendor: 'Realtek Semiconductor', type: 'server', defaultModel: 'Development Desktop Workstation', tag: 'workstation', snmp: false },
  { prefix: 'A4:83:E7', vendor: 'Apple Inc.', type: 'server', defaultModel: 'MacBook Pro / iMac Workstation', tag: 'workstation', snmp: false },
  { prefix: 'F0:18:98', vendor: 'Apple Inc.', type: 'server', defaultModel: 'Mac mini / Studio Server', tag: 'server', snmp: false },

  // 12. Mobile Clients (Android, iOS Smartphones)
  { prefix: '10:BF:48', vendor: 'Xiaomi Communications', type: 'server', defaultModel: 'Xiaomi Smartphone', tag: 'mobile', snmp: false },
  { prefix: '74:F2:FA', vendor: 'Samsung Electronics', type: 'server', defaultModel: 'Samsung Galaxy Mobile', tag: 'mobile', snmp: false },
  { prefix: '7A:A4:EE', vendor: 'Randomized MAC / Mobile', type: 'server', defaultModel: 'Mobile Client (Private MAC)', tag: 'mobile', snmp: false },
  { prefix: '02:2E:6D', vendor: 'Randomized MAC / Mobile', type: 'server', defaultModel: 'Mobile Device', tag: 'mobile', snmp: false },
  { prefix: '9A:99:3B', vendor: 'Mobile Client', type: 'server', defaultModel: 'Mobile Handset', tag: 'mobile', snmp: false },
  { prefix: '12:D0:B6', vendor: 'Mobile Client', type: 'server', defaultModel: 'Wireless Client Host', tag: 'mobile', snmp: false },
  { prefix: '9E:A6:E6', vendor: 'Mobile Client', type: 'server', defaultModel: 'Smart Device Client', tag: 'mobile', snmp: false },
];

/**
 * Fixed Hostname/Identity Map for known core infrastructure in SUNDAYA network
 */
const KNOWN_SUNDAYA_HOSTS: Record<string, { name: string; vendor: string; type: DeviceType; tag: VendorFingerprintResult['categoryTag']; snmp: boolean }> = {
  '192.168.100.1': { name: 'MikroTik CCR Main Core Router', vendor: 'MikroTik', type: 'router', tag: 'router', snmp: true },
  '192.168.100.2': { name: 'Zeus BIND9 Primary DNS Server', vendor: 'Zeus Linux', type: 'server', tag: 'server', snmp: true },
  '192.168.100.8': { name: 'Grafana Monitoring Server', vendor: 'Linux Proxmox VM', type: 'server', tag: 'server', snmp: true },
  '192.168.100.14': { name: 'NMS-NOC Production Dashboard', vendor: 'Linux Proxmox VM', type: 'server', tag: 'server', snmp: true },
  '192.168.100.226': { name: 'Prometheus & Loki Observability Server', vendor: 'Linux Proxmox VM', type: 'server', tag: 'server', snmp: true },
  '192.168.3.1': { name: 'MikroTik RB SUNDAYA Office Gateway', vendor: 'MikroTik', type: 'router', tag: 'router', snmp: true },
  '192.168.3.2': { name: 'Ruijie Managed PoE Switch (RG-ES208GC)', vendor: 'Ruijie Networks', type: 'switch', tag: 'switch', snmp: true },
  '192.168.3.3': { name: 'Ruijie Reyee EW1200 AP', vendor: 'Ruijie Reyee', type: 'access_point', tag: 'access_point', snmp: true },
};

/**
 * Comprehensive vendor & device type fingerprinting based on IP, MAC OUI, and optional DHCP hostname / sysDescr
 */
export function fingerprintDevice(
  ip: string,
  rawMac: string,
  dhcpHostname?: string,
  snmpSysDescr?: string
): VendorFingerprintResult {
  const mac = normalizeMac(rawMac);

  // 1. Check known core SUNDAYA infrastructure IP
  if (KNOWN_SUNDAYA_HOSTS[ip]) {
    const known = KNOWN_SUNDAYA_HOSTS[ip];
    return {
      vendor: known.vendor,
      type: known.type,
      suggestedName: known.name,
      model: known.name,
      snmpSuggested: known.snmp,
      categoryTag: known.tag,
    };
  }

  // 2. Check SNMP sysDescr if available
  if (snmpSysDescr) {
    const desc = snmpSysDescr.toLowerCase();
    if (desc.includes('routeros') || desc.includes('mikrotik')) {
      return {
        vendor: 'MikroTik',
        type: 'router',
        suggestedName: dhcpHostname ? `MikroTik (${dhcpHostname})` : `MikroTik Router (${ip})`,
        model: snmpSysDescr.split('\n')[0].substring(0, 40),
        snmpSuggested: true,
        categoryTag: 'router',
      };
    }
    if (desc.includes('ruijie') || desc.includes('reyee')) {
      const isAp = desc.includes('ap') || desc.includes('rap') || desc.includes('wireless');
      return {
        vendor: 'Ruijie Networks',
        type: isAp ? 'access_point' : 'switch',
        suggestedName: dhcpHostname ? `Ruijie (${dhcpHostname})` : isAp ? `Ruijie AP (${ip})` : `Ruijie Switch (${ip})`,
        model: isAp ? 'Ruijie Reyee Access Point' : 'Ruijie Managed Switch',
        snmpSuggested: true,
        categoryTag: isAp ? 'access_point' : 'switch',
      };
    }
    if (desc.includes('cisco')) {
      return {
        vendor: 'Cisco Systems',
        type: 'switch',
        suggestedName: dhcpHostname ? `Cisco (${dhcpHostname})` : `Cisco Switch (${ip})`,
        model: 'Cisco Managed Switch',
        snmpSuggested: true,
        categoryTag: 'switch',
      };
    }
    if (desc.includes('linux')) {
      return {
        vendor: 'Linux Host / Server',
        type: 'server',
        suggestedName: dhcpHostname ? `${dhcpHostname} (Linux Server)` : `Linux Server (${ip})`,
        model: 'Linux System',
        snmpSuggested: true,
        categoryTag: 'server',
      };
    }
  }

  // 3. Match against MAC OUI Database
  for (const entry of VENDOR_OUI_MAP) {
    if (mac.startsWith(entry.prefix)) {
      let suggestedName = entry.defaultModel;
      if (dhcpHostname && dhcpHostname.trim() !== '') {
        suggestedName = `${dhcpHostname.trim()} (${entry.vendor})`;
      } else if (entry.tag === 'workstation' || entry.tag === 'mobile') {
        suggestedName = `${entry.vendor} Host (${ip})`;
      }

      return {
        vendor: entry.vendor,
        type: entry.type,
        suggestedName,
        model: entry.defaultModel,
        snmpSuggested: entry.snmp,
        categoryTag: entry.tag,
      };
    }
  }

  // 4. Subnet-based heuristics if MAC OUI is unknown or randomized
  if (ip.startsWith('192.168.100.')) {
    const hostNum = parseInt(ip.split('.').pop() || '0', 10);
    return {
      vendor: 'Server Farm / Proxmox',
      type: 'server',
      suggestedName: dhcpHostname ? `${dhcpHostname} (Server)` : `Server-Node-${hostNum} (${ip})`,
      model: 'Enterprise Server Node',
      snmpSuggested: true,
      categoryTag: 'server',
    };
  }

  if (ip.startsWith('172.31.1.')) {
    const hostNum = parseInt(ip.split('.').pop() || '0', 10);
    return {
      vendor: 'Hikvision / Security',
      type: 'server',
      suggestedName: dhcpHostname ? `CCTV-${dhcpHostname}` : `CCTV-Camera-CAM${hostNum.toString().padStart(2, '0')} (${ip})`,
      model: 'IP Surveillance Camera',
      snmpSuggested: false,
      categoryTag: 'cctv',
    };
  }

  if (ip.startsWith('192.168.2.')) {
    return {
      vendor: 'Produksi / Factory',
      type: 'server',
      suggestedName: dhcpHostname ? `Prod-${dhcpHostname}` : `Produksi Host (${ip})`,
      model: 'Production Terminal / Sensor',
      snmpSuggested: false,
      categoryTag: 'workstation',
    };
  }

  // 5. Default Fallback
  return {
    vendor: 'Network Client',
    type: 'server',
    suggestedName: dhcpHostname ? `${dhcpHostname} (${ip})` : `Client Host (${ip})`,
    model: 'Connected Network Client',
    snmpSuggested: false,
    categoryTag: 'workstation',
  };
}
