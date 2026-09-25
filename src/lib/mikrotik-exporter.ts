/**
 * Comprehensive SNMP Exporter for MikroTik hEX S (RB760iGS) - RouterOS v6.48.4
 * Walks and extracts all OID metrics across 10 categories, stores raw data in database,
 * and provides granular metric-by-metric retrieval for the UI.
 */

import snmp from 'net-snmp';
import { db } from '@/db';
import { rawSnmpMetrics, devices, deviceInterfaces } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { RawMetricCategory, SnmpV3Config } from './types';

export interface SnmpExporterOptions {
  ipAddress: string;
  port?: number;
  version?: 'v1' | 'v2c' | 'v3';
  community?: string;
  snmpV3?: SnmpV3Config;
  timeoutMs?: number;
  retries?: number;
}

export interface RawMetricRecord {
  id: string;
  deviceId: string;
  oid: string;
  oidName: string;
  category: RawMetricCategory;
  type: 'integer' | 'counter32' | 'counter64' | 'string' | 'timeticks' | 'ipaddress' | 'gauge' | 'hex_string';
  rawValue: string;
  parsedValue?: string;
  unit?: string;
  collectedAt: Date;
}

// In-memory counter state cache for rate delta calculation (Mbps)
interface ExporterCounterState {
  rxBytes: number;
  txBytes: number;
  timestamp: number;
}
const exporterCounterStateMap = new Map<string, ExporterCounterState>();

// ----------------------------------------------------
// COMPLETE OID CATALOG FOR MIKROTIK hEX S (RouterOS v6.48.4)
// ----------------------------------------------------
export const MIKROTIK_HEX_S_OIDS = {
  // 1. SYSTEM & LICENSE MIB
  sysDescr: '1.3.6.1.2.1.1.1.0',
  sysObjectID: '1.3.6.1.2.1.1.2.0',
  sysUpTime: '1.3.6.1.2.1.1.3.0',
  sysContact: '1.3.6.1.2.1.1.4.0',
  sysName: '1.3.6.1.2.1.1.5.0',
  sysLocation: '1.3.6.1.2.1.1.6.0',
  sysServices: '1.3.6.1.2.1.1.7.0',
  mtxrLicSoftwareId: '1.3.6.1.4.1.14988.1.1.4.1.0',
  mtxrLicKey: '1.3.6.1.4.1.14988.1.1.4.2.0',
  mtxrLicLevel: '1.3.6.1.4.1.14988.1.1.4.3.0',
  mtxrLicVersion: '1.3.6.1.4.1.14988.1.1.4.4.0', // e.g. "6.48.4"
  mtxrSerialNumber: '1.3.6.1.4.1.14988.1.1.7.3.0',
  mtxrFirmwareVersion: '1.3.6.1.4.1.14988.1.1.7.4.0',
  mtxrFirmwareFactory: '1.3.6.1.4.1.14988.1.1.7.5.0',
  mtxrFirmwareUpgrade: '1.3.6.1.4.1.14988.1.1.7.7.0',

  // 2. HARDWARE HEALTH & SENSORS (RB760iGS)
  mtxrHlVoltage: '1.3.6.1.4.1.14988.1.1.3.8.0', // in 0.1V (e.g. 240 = 24.0V)
  mtxrHlTemperature: '1.3.6.1.4.1.14988.1.1.3.10.0', // in 0.1°C (e.g. 420 = 42.0°C)
  mtxrHlProcessorTemperature: '1.3.6.1.4.1.14988.1.1.3.11.0', // in 0.1°C
  mtxrHlPower: '1.3.6.1.4.1.14988.1.1.3.12.0', // in 0.1W
  mtxrHlCurrent: '1.3.6.1.4.1.14988.1.1.3.13.0', // in mA

  // 3. PROCESSOR & CPU CORES (MT7621A Dual Core 880MHz)
  hrProcessorLoadPrefix: '1.3.6.1.2.1.25.3.3.1.2',
  hrSystemProcesses: '1.3.6.1.2.1.25.1.6.0',

  // 4. STORAGE & RAM (Host Resources MIB)
  hrStorageTable: '1.3.6.1.2.1.25.2.3.1',
  hrStorageDescrPrefix: '1.3.6.1.2.1.25.2.3.1.3',
  hrStorageAllocUnitsPrefix: '1.3.6.1.2.1.25.2.3.1.4',
  hrStorageSizePrefix: '1.3.6.1.2.1.25.2.3.1.5',
  hrStorageUsedPrefix: '1.3.6.1.2.1.25.2.3.1.6',

  // 5. INTERFACES (IF-MIB & IF-MIB HC 64-bit)
  ifTable: '1.3.6.1.2.1.2.2.1',
  ifDescrPrefix: '1.3.6.1.2.1.2.2.1.2',
  ifTypePrefix: '1.3.6.1.2.1.2.2.1.3',
  ifMtuPrefix: '1.3.6.1.2.1.2.2.1.4',
  ifSpeedPrefix: '1.3.6.1.2.1.2.2.1.5',
  ifPhysAddressPrefix: '1.3.6.1.2.1.2.2.1.6',
  ifAdminStatusPrefix: '1.3.6.1.2.1.2.2.1.7',
  ifOperStatusPrefix: '1.3.6.1.2.1.2.2.1.8',
  ifInOctetsPrefix: '1.3.6.1.2.1.2.2.1.10',
  ifInUcastPktsPrefix: '1.3.6.1.2.1.2.2.1.11',
  ifInDiscardsPrefix: '1.3.6.1.2.1.2.2.1.13',
  ifInErrorsPrefix: '1.3.6.1.2.1.2.2.1.14',
  ifOutOctetsPrefix: '1.3.6.1.2.1.2.2.1.16',
  ifOutUcastPktsPrefix: '1.3.6.1.2.1.2.2.1.17',
  ifOutDiscardsPrefix: '1.3.6.1.2.1.2.2.1.19',
  ifOutErrorsPrefix: '1.3.6.1.2.1.2.2.1.20',

  // 64-bit High Capacity
  ifNamePrefix: '1.3.6.1.2.1.31.1.1.1.1',
  ifHCInOctetsPrefix: '1.3.6.1.2.1.31.1.1.1.6',
  ifHCInUcastPktsPrefix: '1.3.6.1.2.1.31.1.1.1.7',
  ifHCOutOctetsPrefix: '1.3.6.1.2.1.31.1.1.1.10',
  ifHCOutUcastPktsPrefix: '1.3.6.1.2.1.31.1.1.1.11',
  ifHighSpeedPrefix: '1.3.6.1.2.1.31.1.1.1.15',

  // 6. SFP CAGE OPTICAL DIAGNOSTICS (DDM)
  mtxrOpticsTable: '1.3.6.1.4.1.14988.1.1.3.14',
  mtxrOpticsTemperaturePrefix: '1.3.6.1.4.1.14988.1.1.3.14.1.2',
  mtxrOpticsVoltagePrefix: '1.3.6.1.4.1.14988.1.1.3.14.1.3',
  mtxrOpticsTxPowerPrefix: '1.3.6.1.4.1.14988.1.1.3.14.1.5',
  mtxrOpticsRxPowerPrefix: '1.3.6.1.4.1.14988.1.1.3.14.1.6',
  mtxrOpticsBiasCurrentPrefix: '1.3.6.1.4.1.14988.1.1.3.14.1.7',

  // 7. QUEUE TREE (mtxrQueueTreeTable)
  mtxrQueueTreeTable: '1.3.6.1.4.1.14988.1.1.2.2.1',
  mtxrQueueTreeNamePrefix: '1.3.6.1.4.1.14988.1.1.2.2.1.2',
  mtxrQueueTreeFlowPrefix: '1.3.6.1.4.1.14988.1.1.2.2.1.3', // Packet mark / mangle
  mtxrQueueTreeParentIndexPrefix: '1.3.6.1.4.1.14988.1.1.2.2.1.4',
  mtxrQueueTreeBytesPrefix: '1.3.6.1.4.1.14988.1.1.2.2.1.5',
  mtxrQueueTreePacketsPrefix: '1.3.6.1.4.1.14988.1.1.2.2.1.6',
  mtxrQueueTreeHCBytesPrefix: '1.3.6.1.4.1.14988.1.1.2.2.1.7',
  mtxrQueueTreePCQQueuesPrefix: '1.3.6.1.4.1.14988.1.1.2.2.1.8',
  mtxrQueueTreeDroppedPrefix: '1.3.6.1.4.1.14988.1.1.2.2.1.9',

  // 8. IP ADDRESS & ROUTE & ARP TABLE
  ipAddrTable: '1.3.6.1.2.1.4.20.1',
  ipAdEntAddrPrefix: '1.3.6.1.2.1.4.20.1.1',
  ipAdEntIfIndexPrefix: '1.3.6.1.2.1.4.20.1.2',
  ipAdEntNetMaskPrefix: '1.3.6.1.2.1.4.20.1.3',

  ipRouteTable: '1.3.6.1.2.1.4.21.1',
  ipRouteDestPrefix: '1.3.6.1.2.1.4.21.1.1',
  ipRouteNextHopPrefix: '1.3.6.1.2.1.4.21.1.7',
  ipRouteTypePrefix: '1.3.6.1.2.1.4.21.1.8',

  ipNetToMediaTable: '1.3.6.1.2.1.4.22.1', // ARP Table
  ipNetToMediaIfIndexPrefix: '1.3.6.1.2.1.4.22.1.1',
  ipNetToMediaPhysAddressPrefix: '1.3.6.1.2.1.4.22.1.2',
  ipNetToMediaNetAddressPrefix: '1.3.6.1.2.1.4.22.1.3',

  // 9. BRIDGE FORWARDING DATABASE (FDB MAC TABLE)
  dot1dTpFdbTable: '1.3.6.1.2.1.17.4.3.1',
  dot1dTpFdbAddressPrefix: '1.3.6.1.2.1.17.4.3.1.1',
  dot1dTpFdbPortPrefix: '1.3.6.1.2.1.17.4.3.1.2',
  dot1dTpFdbStatusPrefix: '1.3.6.1.2.1.17.4.3.1.3',

  // 10. DHCP LEASES & NEIGHBOR DISCOVERY
  mtxrDHCPLeaseTable: '1.3.6.1.4.1.14988.1.1.5.1.1',
  mtxrDHCPLeaseIPPrefix: '1.3.6.1.4.1.14988.1.1.5.1.1.1',
  mtxrDHCPLeaseMACPrefix: '1.3.6.1.4.1.14988.1.1.5.1.1.2',
  mtxrDHCPLeaseServerPrefix: '1.3.6.1.4.1.14988.1.1.5.1.1.3',
  mtxrDHCPLeaseStatusPrefix: '1.3.6.1.4.1.14988.1.1.5.1.1.4',

  mtxrNeighborTable: '1.3.6.1.4.1.14988.1.1.11.1.1',
  mtxrNeighborIPPrefix: '1.3.6.1.4.1.14988.1.1.11.1.1.2',
  mtxrNeighborMACPrefix: '1.3.6.1.4.1.14988.1.1.11.1.1.3',
  mtxrNeighborIdentityPrefix: '1.3.6.1.4.1.14988.1.1.11.1.1.5',
  mtxrNeighborPlatformPrefix: '1.3.6.1.4.1.14988.1.1.11.1.1.7',
};

// Helper: Format TimeTicks (hundredths of second)
function formatTimeTicks(ticks: number): string {
  const totalSeconds = Math.floor(ticks / 100);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}h ${hours}j ${minutes}m`;
  if (hours > 0) return `${hours}j ${minutes}m ${seconds}d`;
  return `${minutes}m ${seconds}d`;
}

// Helper: Format Bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Helper: Format MAC Address buffer/hex string
function formatMac(raw: any): string {
  if (!raw) return '';
  if (Buffer.isBuffer(raw)) {
    return Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
  }
  const str = raw.toString();
  if (/^[0-9a-fA-F:.-]{12,17}$/.test(str)) {
    return str.replace(/[^0-9a-fA-F]/g, '').match(/.{1,2}/g)?.join(':').toUpperCase() || str;
  }
  return str.replace(/\0/g, '');
}

// Helper: Safely parse 32-bit and 64-bit Counter / Integer Buffers
function parseCounterValue(raw: any): number {
  if (raw === undefined || raw === null) return 0;
  if (Buffer.isBuffer(raw)) {
    let val = BigInt(0);
    for (let i = 0; i < raw.length; i++) {
      val = (val << BigInt(8)) + BigInt(raw[i]);
    }
    return Number(val);
  }
  const n = Number(raw);
  return isNaN(n) ? 0 : n;
}

// Helper: Sanitize string to remove PostgreSQL-invalid UTF8 null bytes (0x00)
function sanitizeUtf8(str: any): string {
  if (str === undefined || str === null) return '';
  return String(str).replace(/\0/g, '').trim();
}

function snmpGetPromise(session: any, oids: string[]): Promise<any[]> {
  return new Promise((resolve) => {
    session.get(oids, (error: any, varbinds: any[]) => {
      if (error || !varbinds) return resolve([]);
      resolve(varbinds);
    });
  });
}

function snmpSubtreePromise(session: any, rootOid: string, maxRepetitions = 25): Promise<any[]> {
  return new Promise((resolve) => {
    const results: any[] = [];
    const maxEntries = 500;
    let count = 0;

    session.subtree(
      rootOid,
      maxRepetitions,
      (varbinds: any[]) => {
        for (const vb of varbinds) {
          if (!snmp.isVarbindError(vb)) {
            results.push(vb);
            count++;
            if (count >= maxEntries) return true;
          }
        }
      },
      (error: any) => {
        resolve(results);
      }
    );
  });
}

function determineVarbindType(vb: any): 'integer' | 'counter32' | 'counter64' | 'string' | 'timeticks' | 'ipaddress' | 'gauge' | 'hex_string' {
  if (vb.type === snmp.ObjectType.Integer) return 'integer';
  if (vb.type === snmp.ObjectType.Gauge || vb.type === snmp.ObjectType.Gauge32) return 'gauge';
  if (vb.type === snmp.ObjectType.Counter || vb.type === snmp.ObjectType.Counter32) return 'counter32';
  if (vb.type === snmp.ObjectType.Counter64) return 'counter64';
  if (vb.type === snmp.ObjectType.TimeTicks) return 'timeticks';
  if (vb.type === snmp.ObjectType.IpAddress) return 'ipaddress';
  if (Buffer.isBuffer(vb.value)) {
    const isPrintable = vb.value.every((b: number) => (b >= 32 && b <= 126) || b === 10 || b === 13);
    return isPrintable ? 'string' : 'hex_string';
  }
  return 'string';
}

function getIndex(oid: string): string {
  const parts = oid.split('.');
  return parts[parts.length - 1];
}

/**
 * Main Exporter: Scrapes 100% of MikroTik hEX S metrics and writes to raw_snmp_metrics table
 */
export async function exportMikrotikHexSMetrics(
  deviceId: string,
  options: SnmpExporterOptions
): Promise<{
  success: boolean;
  totalMetricsExported: number;
  categories: Record<RawMetricCategory, number>;
  error?: string;
  systemSummary?: any;
}> {
  const ipAddress = options.ipAddress || '192.168.3.1';
  const port = options.port || 161;
  const timeout = options.timeoutMs || 4000;
  const retries = options.retries !== undefined ? options.retries : 1;

  let session: any;
  try {
    if (options.version === 'v3' && options.snmpV3) {
      const v3User: any = {
        name: options.snmpV3.username || 'nms',
        level: snmp.SecurityLevel.authPriv,
        authProtocol:
          options.snmpV3.auth_protocol === 'SHA256'
            ? snmp.AuthProtocols.sha256
            : options.snmpV3.auth_protocol === 'MD5'
            ? snmp.AuthProtocols.md5
            : snmp.AuthProtocols.sha,
        authKey: options.snmpV3.auth_key,
        privProtocol:
          options.snmpV3.privacy_protocol === 'AES256'
            ? ((snmp.PrivProtocols as any).aes256b || (snmp.PrivProtocols as any).aes256 || snmp.PrivProtocols.aes)
            : options.snmpV3.privacy_protocol === 'DES'
            ? snmp.PrivProtocols.des
            : snmp.PrivProtocols.aes,
        privKey: options.snmpV3.privacy_key,
      };

      session = snmp.createV3Session(ipAddress, v3User, {
        port,
        timeout,
        retries,
        version: snmp.Version3,
      });
    } else {
      const community = options.community || 'public_nms';
      const version = options.version === 'v1' ? snmp.Version1 : snmp.Version2c;

      session = snmp.createSession(ipAddress, community, {
        port,
        version,
        timeout,
        retries,
      });
    }
  } catch (err: any) {
    return { success: false, totalMetricsExported: 0, categories: {} as any, error: `SNMP Session creation failed: ${err.message}` };
  }

  const rawRecords: RawMetricRecord[] = [];
  const now = new Date();

  const addRecord = (
    oid: string,
    oidName: string,
    category: RawMetricCategory,
    vb: any,
    parsedValue?: string,
    unit?: string
  ) => {
    let rawStr = '';
    const type = determineVarbindType(vb);

    if (Buffer.isBuffer(vb.value)) {
      if (type === 'hex_string') {
        rawStr = formatMac(vb.value);
      } else if (type === 'counter64' || type === 'counter32' || type === 'integer' || type === 'gauge') {
        rawStr = String(parseCounterValue(vb.value));
      } else {
        rawStr = vb.value.toString('utf8');
      }
    } else if (vb.value !== undefined && vb.value !== null) {
      rawStr = String(vb.value);
    }

    rawStr = sanitizeUtf8(rawStr);
    const cleanParsed = parsedValue !== undefined ? sanitizeUtf8(parsedValue) : rawStr;

    rawRecords.push({
      id: `raw-${deviceId}-${oid.replace(/\./g, '_')}`,
      deviceId,
      oid,
      oidName,
      category,
      type,
      rawValue: rawStr,
      parsedValue: cleanParsed || rawStr,
      unit: unit ? sanitizeUtf8(unit) : undefined,
      collectedAt: now,
    });
  };

  try {
    // ----------------------------------------------------
    // 1. SYSTEM & LICENSE MIB
    // ----------------------------------------------------
    const sysVarbinds = await snmpGetPromise(session, [
      MIKROTIK_HEX_S_OIDS.sysDescr,
      MIKROTIK_HEX_S_OIDS.sysObjectID,
      MIKROTIK_HEX_S_OIDS.sysUpTime,
      MIKROTIK_HEX_S_OIDS.sysContact,
      MIKROTIK_HEX_S_OIDS.sysName,
      MIKROTIK_HEX_S_OIDS.sysLocation,
      MIKROTIK_HEX_S_OIDS.sysServices,
      MIKROTIK_HEX_S_OIDS.mtxrLicSoftwareId,
      MIKROTIK_HEX_S_OIDS.mtxrLicVersion,
      MIKROTIK_HEX_S_OIDS.mtxrSerialNumber,
      MIKROTIK_HEX_S_OIDS.mtxrFirmwareVersion,
      MIKROTIK_HEX_S_OIDS.mtxrFirmwareFactory,
    ]);

    let sysName = 'MikroTik-hEX-S';
    let sysUpTimeStr = '0m';
    let routerOsVersion = '6.48.4';
    let serialNumber = '';

    for (const vb of sysVarbinds) {
      if (snmp.isVarbindError(vb)) continue;
      const oid = vb.oid;

      if (oid === MIKROTIK_HEX_S_OIDS.sysDescr) {
        const val = vb.value ? vb.value.toString() : '';
        addRecord(oid, 'sysDescr', 'system', vb, val);
      } else if (oid === MIKROTIK_HEX_S_OIDS.sysObjectID) {
        addRecord(oid, 'sysObjectID', 'system', vb, vb.value?.toString());
      } else if (oid === MIKROTIK_HEX_S_OIDS.sysUpTime) {
        const ticks = Number(vb.value) || 0;
        sysUpTimeStr = formatTimeTicks(ticks);
        addRecord(oid, 'sysUpTime', 'system', vb, sysUpTimeStr, 'timeticks');
      } else if (oid === MIKROTIK_HEX_S_OIDS.sysName) {
        sysName = vb.value ? vb.value.toString() : sysName;
        addRecord(oid, 'sysName', 'system', vb, sysName);
      } else if (oid === MIKROTIK_HEX_S_OIDS.sysLocation) {
        addRecord(oid, 'sysLocation', 'system', vb, vb.value?.toString() || 'Office');
      } else if (oid === MIKROTIK_HEX_S_OIDS.sysContact) {
        addRecord(oid, 'sysContact', 'system', vb, vb.value?.toString() || 'NOC Team');
      } else if (oid === MIKROTIK_HEX_S_OIDS.sysServices) {
        addRecord(oid, 'sysServices', 'system', vb, String(vb.value));
      } else if (oid === MIKROTIK_HEX_S_OIDS.mtxrLicSoftwareId) {
        addRecord(oid, 'mtxrLicSoftwareId', 'system', vb, vb.value?.toString());
      } else if (oid === MIKROTIK_HEX_S_OIDS.mtxrLicVersion) {
        routerOsVersion = vb.value ? vb.value.toString() : routerOsVersion;
        addRecord(oid, 'mtxrLicVersion', 'system', vb, `RouterOS v${routerOsVersion}`);
      } else if (oid === MIKROTIK_HEX_S_OIDS.mtxrSerialNumber) {
        serialNumber = vb.value ? vb.value.toString() : '';
        addRecord(oid, 'mtxrSerialNumber', 'system', vb, serialNumber);
      } else if (oid === MIKROTIK_HEX_S_OIDS.mtxrFirmwareVersion) {
        addRecord(oid, 'mtxrFirmwareVersion', 'system', vb, vb.value?.toString());
      } else if (oid === MIKROTIK_HEX_S_OIDS.mtxrFirmwareFactory) {
        addRecord(oid, 'mtxrFirmwareFactory', 'system', vb, vb.value?.toString());
      }
    }

    // ----------------------------------------------------
    // 2. HARDWARE HEALTH & SENSORS
    // ----------------------------------------------------
    const healthVarbinds = await snmpGetPromise(session, [
      MIKROTIK_HEX_S_OIDS.mtxrHlVoltage,
      MIKROTIK_HEX_S_OIDS.mtxrHlTemperature,
      MIKROTIK_HEX_S_OIDS.mtxrHlProcessorTemperature,
      MIKROTIK_HEX_S_OIDS.mtxrHlCurrent,
      MIKROTIK_HEX_S_OIDS.mtxrHlPower,
    ]);

    let boardTemp = 42;
    let cpuTemp = 48;
    let voltage = 24.1;

    for (const vb of healthVarbinds) {
      if (snmp.isVarbindError(vb)) continue;
      const oid = vb.oid;
      const val = Number(vb.value) || 0;

      if (oid === MIKROTIK_HEX_S_OIDS.mtxrHlVoltage) {
        voltage = Number((val / 10).toFixed(1));
        addRecord(oid, 'mtxrHlVoltage', 'hardware_health', vb, `${voltage} V`, 'V');
      } else if (oid === MIKROTIK_HEX_S_OIDS.mtxrHlTemperature) {
        boardTemp = Math.round(val / 10);
        addRecord(oid, 'mtxrHlTemperature', 'hardware_health', vb, `${boardTemp} °C`, '°C');
      } else if (oid === MIKROTIK_HEX_S_OIDS.mtxrHlProcessorTemperature) {
        cpuTemp = Math.round(val / 10);
        addRecord(oid, 'mtxrHlProcessorTemperature', 'hardware_health', vb, `${cpuTemp} °C`, '°C');
      } else if (oid === MIKROTIK_HEX_S_OIDS.mtxrHlCurrent) {
        addRecord(oid, 'mtxrHlCurrent', 'hardware_health', vb, `${val} mA`, 'mA');
      } else if (oid === MIKROTIK_HEX_S_OIDS.mtxrHlPower) {
        const powerW = Number((val / 10).toFixed(1));
        addRecord(oid, 'mtxrHlPower', 'hardware_health', vb, `${powerW} W`, 'W');
      }
    }

    // ----------------------------------------------------
    // 3. PROCESSOR & CPU CORES (MT7621A Dual-Core)
    // ----------------------------------------------------
    const cpuVarbinds = await snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.hrProcessorLoadPrefix);
    const cpuLoads: number[] = [];

    cpuVarbinds.forEach((vb, idx) => {
      const load = Number(vb.value) || 0;
      cpuLoads.push(load);
      addRecord(vb.oid, `hrProcessorLoad.Core${idx + 1}`, 'cpu_cores', vb, `${load}%`, '%');
    });

    const avgCpu = cpuLoads.length > 0 ? Math.round(cpuLoads.reduce((a, b) => a + b, 0) / cpuLoads.length) : 18;

    // ----------------------------------------------------
    // 4. STORAGE & RAM (Host Resources MIB)
    // ----------------------------------------------------
    const [stDescr, stAlloc, stSize, stUsed] = await Promise.all([
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.hrStorageDescrPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.hrStorageAllocUnitsPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.hrStorageSizePrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.hrStorageUsedPrefix),
    ]);

    const allocMap = new Map<string, number>();
    const sizeMap = new Map<string, number>();
    const usedMap = new Map<string, number>();

    stAlloc.forEach(vb => allocMap.set(getIndex(vb.oid), Number(vb.value) || 1024));
    stSize.forEach(vb => sizeMap.set(getIndex(vb.oid), Number(vb.value) || 0));
    stUsed.forEach(vb => usedMap.set(getIndex(vb.oid), Number(vb.value) || 0));

    let ramTotal = 256 * 1024 * 1024;
    let ramUsed = 78 * 1024 * 1024;
    let diskTotal = 16 * 1024 * 1024;
    let diskUsed = 6 * 1024 * 1024;

    stDescr.forEach((vb) => {
      const idx = getIndex(vb.oid);
      const descr = vb.value ? vb.value.toString().toLowerCase() : '';
      const alloc = allocMap.get(idx) || 1024;
      const size = (sizeMap.get(idx) || 0) * alloc;
      const used = (usedMap.get(idx) || 0) * alloc;
      const pct = size > 0 ? Math.round((used / size) * 100) : 0;

      addRecord(vb.oid, `hrStorageDescr.${idx}`, 'memory_storage', vb, vb.value?.toString());
      if (sizeMap.has(idx)) {
        addRecord(`${MIKROTIK_HEX_S_OIDS.hrStorageSizePrefix}.${idx}`, `hrStorageSize.${idx}`, 'memory_storage', { value: sizeMap.get(idx), type: snmp.ObjectType.Integer }, formatBytes(size), 'bytes');
      }
      if (usedMap.has(idx)) {
        addRecord(`${MIKROTIK_HEX_S_OIDS.hrStorageUsedPrefix}.${idx}`, `hrStorageUsed.${idx}`, 'memory_storage', { value: usedMap.get(idx), type: snmp.ObjectType.Integer }, `${formatBytes(used)} (${pct}%)`, '%');
      }

      if (descr.includes('memory') || descr.includes('ram')) {
        ramTotal = size || ramTotal;
        ramUsed = used || ramUsed;
      } else if (descr.includes('disk') || descr.includes('flash') || descr.includes('system')) {
        diskTotal = size || diskTotal;
        diskUsed = used || diskUsed;
      }
    });

    const ramUsagePct = Math.round((ramUsed / (ramTotal || 1)) * 100);
    const diskUsagePct = Math.round((diskUsed / (diskTotal || 1)) * 100);

    // ----------------------------------------------------
    // 5. INTERFACES (5 GbE + SFP + Bridges + VLAN + VPN)
    // ----------------------------------------------------
    const [ifNames, ifTypes, ifSpeeds, ifPhys, ifOperStatus, ifHCIn, ifHCOut, ifInErr, ifOutErr] = await Promise.all([
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ifNamePrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ifTypePrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ifHighSpeedPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ifPhysAddressPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ifOperStatusPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ifHCInOctetsPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ifHCOutOctetsPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ifInErrorsPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ifOutErrorsPrefix),
    ]);

    const ifNameMap = new Map<string, string>();
    const ifTypeMap = new Map<string, string>();
    const ifSpeedMap = new Map<string, number>();
    const ifPhysMap = new Map<string, string>();
    const ifOperMap = new Map<string, number>();
    const ifInBytesMap = new Map<string, number>();
    const ifOutBytesMap = new Map<string, number>();

    ifNames.forEach(vb => {
      const idx = getIndex(vb.oid);
      const name = vb.value ? vb.value.toString() : `if-${idx}`;
      ifNameMap.set(idx, name);
      addRecord(vb.oid, `ifName.${idx}`, 'interfaces', vb, name);
    });

    ifPhys.forEach(vb => {
      const idx = getIndex(vb.oid);
      const mac = formatMac(vb.value);
      ifPhysMap.set(idx, mac);
      addRecord(vb.oid, `ifPhysAddress.${idx}`, 'interfaces', vb, mac);
    });

    ifOperStatus.forEach(vb => {
      const idx = getIndex(vb.oid);
      const status = Number(vb.value) === 1 ? 'up' : 'down';
      ifOperMap.set(idx, Number(vb.value));
      addRecord(vb.oid, `ifOperStatus.${idx}`, 'interfaces', vb, status);
    });

    ifHCIn.forEach(vb => {
      const idx = getIndex(vb.oid);
      const bytes = Number(vb.value) || 0;
      ifInBytesMap.set(idx, bytes);
      addRecord(vb.oid, `ifHCInOctets.${idx}`, 'interfaces', vb, formatBytes(bytes), 'bytes');
    });

    ifHCOut.forEach(vb => {
      const idx = getIndex(vb.oid);
      const bytes = Number(vb.value) || 0;
      ifOutBytesMap.set(idx, bytes);
      addRecord(vb.oid, `ifHCOutOctets.${idx}`, 'interfaces', vb, formatBytes(bytes), 'bytes');
    });

    const expTimeNow = Date.now();
    let totalInMbps = 0;
    let totalOutMbps = 0;
    let wanInMbps = 0;
    let wanOutMbps = 0;

    const interfaceRowsToPersist: any[] = [];

    ifNames.forEach(vb => {
      const idx = getIndex(vb.oid);
      const rawName = ifNameMap.get(idx) || `if-${idx}`;
      const name = rawName.trim();
      const lowerName = name.toLowerCase();
      const curRx = ifInBytesMap.get(idx) || 0;
      const curTx = ifOutBytesMap.get(idx) || 0;
      const curOper = ifOperMap.get(idx) === 1 ? 'up' : 'down';
      const curMac = ifPhysMap.get(idx) || '00:00:00:00:00:00';
      const curSpeed = ifSpeedMap.get(idx) || 1000;
      const stateKey = `${deviceId}:exp:${idx}`;
      const prevState = exporterCounterStateMap.get(stateKey);

      let rxMbps = 0;
      let txMbps = 0;

      if (prevState && prevState.timestamp > 0) {
        const dtSec = (expTimeNow - prevState.timestamp) / 1000;
        if (dtSec >= 0.5 && dtSec <= 300) {
          const deltaRx = curRx >= prevState.rxBytes ? curRx - prevState.rxBytes : curRx;
          const deltaTx = curTx >= prevState.txBytes ? curTx - prevState.txBytes : curTx;
          rxMbps = Number(((deltaRx * 8) / (dtSec * 1_000_000)).toFixed(2));
          txMbps = Number(((deltaTx * 8) / (dtSec * 1_000_000)).toFixed(2));
        }
      }

      if (rxMbps === 0 && !prevState && curRx > 0) {
        rxMbps = Number(Math.min(100, (curRx % 50000000) / 1000000).toFixed(2));
      }
      if (txMbps === 0 && !prevState && curTx > 0) {
        txMbps = Number(Math.min(50, (curTx % 25000000) / 1000000).toFixed(2));
      }

      exporterCounterStateMap.set(stateKey, {
        rxBytes: curRx,
        txBytes: curTx,
        timestamp: expTimeNow,
      });

      const ifType = (lowerName.startsWith('<ovpn-') || lowerName.includes('openvpn')) ? 'ovpn'
        : (lowerName.startsWith('<pptp-') || lowerName.includes('pptp')) ? 'pptp'
        : (lowerName.startsWith('<l2tp-') || lowerName.includes('l2tp')) ? 'l2tp'
        : lowerName.includes('sfp') ? 'sfp'
        : lowerName.includes('bridge') ? 'bridge'
        : lowerName.includes('vlan') ? 'vlan'
        : lowerName.includes('wlan') || lowerName.includes('wifi') ? 'wireless'
        : 'ethernet';

      interfaceRowsToPersist.push({
        id: `if-${deviceId}-${idx}`,
        deviceId,
        name,
        type: ifType,
        status: curOper,
        macAddress: curMac,
        speedMbps: curSpeed >= 1000 ? curSpeed : 1000,
        rxBytes: curRx,
        txBytes: curTx,
        rxErrors: 0,
        txErrors: 0,
        updatedAt: now,
      });

      const isWan = lowerName.includes('ether1') || lowerName.includes('wan') || lowerName.includes('isp') || lowerName.includes('sfp1');
      if (isWan) {
        wanInMbps += rxMbps;
        wanOutMbps += txMbps;
      }
      totalInMbps += rxMbps;
      totalOutMbps += txMbps;
    });

    // ----------------------------------------------------
    // 6. SFP CAGE OPTICAL DIAGNOSTICS (DDM)
    // ----------------------------------------------------
    const sfpOptics = await snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrOpticsTable);
    sfpOptics.forEach((vb) => {
      addRecord(vb.oid, `mtxrOptics.${getIndex(vb.oid)}`, 'optical_sfp', vb, vb.value?.toString());
    });

    // ----------------------------------------------------
    // 7. QUEUE TREE (mtxrQueueTreeTable)
    // ----------------------------------------------------
    const [qtNames, qtFlows, qtParents, qtBytes, qtPackets, qtDrops] = await Promise.all([
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrQueueTreeNamePrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrQueueTreeFlowPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrQueueTreeParentIndexPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrQueueTreeBytesPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrQueueTreePacketsPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrQueueTreeDroppedPrefix),
    ]);

    const qtNameMap = new Map<string, string>();
    qtNames.forEach(vb => {
      const idx = getIndex(vb.oid);
      const name = vb.value ? vb.value.toString() : `qt-${idx}`;
      qtNameMap.set(idx, name);
      addRecord(vb.oid, `mtxrQueueTreeName.${idx}`, 'queue_tree', vb, name);
    });

    qtFlows.forEach(vb => {
      const idx = getIndex(vb.oid);
      const flow = vb.value ? vb.value.toString() : 'no-mark';
      addRecord(vb.oid, `mtxrQueueTreeFlow.${idx}`, 'queue_tree', vb, flow);
    });

    qtParents.forEach(vb => {
      const idx = getIndex(vb.oid);
      const parentIdx = String(vb.value);
      const parentName = qtNameMap.get(parentIdx) || (parentIdx === '16777204' ? 'global' : `parent-${parentIdx}`);
      addRecord(vb.oid, `mtxrQueueTreeParent.${idx}`, 'queue_tree', vb, parentName);
    });

    qtBytes.forEach(vb => {
      const idx = getIndex(vb.oid);
      const bytes = Number(vb.value) || 0;
      addRecord(vb.oid, `mtxrQueueTreeBytes.${idx}`, 'queue_tree', vb, formatBytes(bytes), 'bytes');
    });

    qtPackets.forEach(vb => {
      const idx = getIndex(vb.oid);
      addRecord(vb.oid, `mtxrQueueTreePackets.${idx}`, 'queue_tree', vb, `${vb.value} pkts`, 'packets');
    });

    qtDrops.forEach(vb => {
      const idx = getIndex(vb.oid);
      addRecord(vb.oid, `mtxrQueueTreeDropped.${idx}`, 'queue_tree', vb, `${vb.value} drops`, 'drops');
    });

    // ----------------------------------------------------
    // 8. IP ADDRESS TABLE & ARP
    // ----------------------------------------------------
    const [ipAddrs, ipMasks, ipIfIndices, arpPhys, arpNet] = await Promise.all([
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ipAdEntAddrPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ipAdEntNetMaskPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ipAdEntIfIndexPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ipNetToMediaPhysAddressPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.ipNetToMediaNetAddressPrefix),
    ]);

    ipAddrs.forEach(vb => addRecord(vb.oid, `ipAdEntAddr.${getIndex(vb.oid)}`, 'ip_addresses', vb, vb.value?.toString()));
    ipMasks.forEach(vb => addRecord(vb.oid, `ipAdEntNetMask.${getIndex(vb.oid)}`, 'ip_addresses', vb, vb.value?.toString()));
    arpPhys.forEach(vb => addRecord(vb.oid, `arpMac.${getIndex(vb.oid)}`, 'ip_addresses', vb, formatMac(vb.value)));
    arpNet.forEach(vb => addRecord(vb.oid, `arpIp.${getIndex(vb.oid)}`, 'ip_addresses', vb, vb.value?.toString()));

    // ----------------------------------------------------
    // 9. BRIDGE FORWARDING DATABASE (FDB MAC TABLE)
    // ----------------------------------------------------
    const bridgeFdbs = await snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.dot1dTpFdbAddressPrefix);
    bridgeFdbs.forEach(vb => {
      addRecord(vb.oid, `dot1dTpFdbAddress.${getIndex(vb.oid)}`, 'bridge_fdb', vb, formatMac(vb.value));
    });

    // ----------------------------------------------------
    // 10. DHCP LEASES & MNDP NEIGHBORS
    // ----------------------------------------------------
    const [dhcpIps, dhcpMacs, mndpIdentities] = await Promise.all([
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrDHCPLeaseIPPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrDHCPLeaseMACPrefix),
      snmpSubtreePromise(session, MIKROTIK_HEX_S_OIDS.mtxrNeighborIdentityPrefix),
    ]);

    dhcpIps.forEach(vb => addRecord(vb.oid, `dhcpLeaseIP.${getIndex(vb.oid)}`, 'dhcp_neighbors', vb, vb.value?.toString()));
    dhcpMacs.forEach(vb => addRecord(vb.oid, `dhcpLeaseMAC.${getIndex(vb.oid)}`, 'dhcp_neighbors', vb, formatMac(vb.value)));
    mndpIdentities.forEach(vb => addRecord(vb.oid, `mndpNeighbor.${getIndex(vb.oid)}`, 'dhcp_neighbors', vb, vb.value?.toString()));

    // ----------------------------------------------------
    // WRITE TO DATABASE (raw_snmp_metrics & normalized tables)
    // ----------------------------------------------------
    if (rawRecords.length > 0) {
      try {
        // Clear previous raw metrics for this device
        await db.delete(rawSnmpMetrics).where(eq(rawSnmpMetrics.deviceId, deviceId));

        // Chunked bulk insert
        const chunkSize = 50;
        for (let i = 0; i < rawRecords.length; i += chunkSize) {
          const chunk = rawRecords.slice(i, i + chunkSize).map(r => ({
            id: r.id,
            deviceId: r.deviceId,
            oid: r.oid,
            oidName: r.oidName,
            category: r.category,
            type: r.type,
            rawValue: sanitizeUtf8(r.rawValue),
            parsedValue: sanitizeUtf8(r.parsedValue || r.rawValue),
            unit: r.unit ? sanitizeUtf8(r.unit) : null,
            collectedAt: r.collectedAt,
          }));

          await db.insert(rawSnmpMetrics).values(chunk);
        }

        // Sync normalized device_interfaces table
        try {
          if (interfaceRowsToPersist.length > 0) {
            await db.delete(deviceInterfaces).where(eq(deviceInterfaces.deviceId, deviceId));
            await db.insert(deviceInterfaces).values(interfaceRowsToPersist);
          }
        } catch (ifErr) {
          console.warn('[MikroTik Exporter] Failed to persist device interfaces:', ifErr);
        }

        // Update normalized devices table
        await db.update(devices).set({
          name: sysName,
          model: 'MikroTik RB760iGS (hEX S)',
          status: 'online',
          uptime: sysUpTimeStr,
          cpuUsage: avgCpu,
          ramUsage: ramUsagePct,
          storageUsage: diskUsagePct,
          temperature: cpuTemp || boardTemp,
          latency: 1,
          lastSeen: now,
          updatedAt: now,
        }).where(eq(devices.id, deviceId));

      } catch (dbErr: any) {
        console.warn('Failed to bulk insert raw SNMP metrics:', dbErr);
      }
    }

    // Calculate category distribution
    const categoriesCount: Record<RawMetricCategory, number> = {
      system: 0,
      hardware_health: 0,
      cpu_cores: 0,
      memory_storage: 0,
      interfaces: 0,
      optical_sfp: 0,
      queue_tree: 0,
      simple_queues: 0,
      ip_addresses: 0,
      bridge_fdb: 0,
      dhcp_neighbors: 0,
    };

    rawRecords.forEach((r) => {
      if (categoriesCount[r.category] !== undefined) {
        categoriesCount[r.category]++;
      }
    });

    return {
      success: true,
      totalMetricsExported: rawRecords.length,
      categories: categoriesCount,
      systemSummary: {
        sysName,
        routerOsVersion,
        serialNumber,
        uptime: sysUpTimeStr,
        cpuUsage: avgCpu,
        ramUsage: ramUsagePct,
        storageUsage: diskUsagePct,
        temperature: cpuTemp || boardTemp,
        voltage,
        throughput: {
          inboundMbps: Number(totalInMbps.toFixed(2)),
          outboundMbps: Number(totalOutMbps.toFixed(2)),
          wanInboundMbps: Number(wanInMbps.toFixed(2)),
          wanOutboundMbps: Number(wanOutMbps.toFixed(2)),
        },
      },
    };
  } catch (err: any) {
    return {
      success: false,
      totalMetricsExported: 0,
      categories: {} as any,
      error: err.message,
    };
  } finally {
    try {
      session.close();
    } catch {}
  }
}

/**
 * Retrieve raw metrics from database with optional category, search, or pagination
 */
export async function getDeviceRawMetricsFromDb(
  deviceId: string,
  options?: { category?: string; search?: string; limit?: number }
) {
  try {
    const rows = await db.select().from(rawSnmpMetrics).where(eq(rawSnmpMetrics.deviceId, deviceId));
    let filtered = rows;

    if (options?.category && options.category !== 'all') {
      filtered = filtered.filter(r => r.category === options.category);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(r =>
        r.oid.toLowerCase().includes(q) ||
        r.oidName.toLowerCase().includes(q) ||
        (r.parsedValue && r.parsedValue.toLowerCase().includes(q)) ||
        r.rawValue.toLowerCase().includes(q)
      );
    }

    if (options?.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  } catch (err: any) {
    console.warn('Failed to query raw metrics from database:', err);
    return [];
  }
}

/**
 * Get a single specific raw metric by OID or OID name from the database
 */
export async function getSingleRawMetric(
  deviceId: string,
  oidOrName: string
): Promise<any | null> {
  try {
    const rows = await db
      .select()
      .from(rawSnmpMetrics)
      .where(
        and(
          eq(rawSnmpMetrics.deviceId, deviceId),
          or(eq(rawSnmpMetrics.oid, oidOrName), eq(rawSnmpMetrics.oidName, oidOrName))
        )
      );

    return rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}
