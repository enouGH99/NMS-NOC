import { db } from './index';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function seed() {
  console.log('🌱 Starting NMS Database Seeding...');

  try {
    // 1. Users
    console.log('Inserting Users...');
    await db.insert(schema.user).values([
      {
        id: 'usr-1',
        name: 'Budi Santoso',
        email: 'admin@kantor.go.id',
        role: 'admin',
        phone: '+62 812-3456-7890',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60',
      },
      {
        id: 'usr-2',
        name: 'Dimas Prakoso',
        email: 'dimas@kantor.go.id',
        role: 'petugas',
        phone: '+62 813-9876-5432',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
      },
      {
        id: 'usr-3',
        name: 'Siti Rahma',
        email: 'siti@kantor.go.id',
        role: 'petugas',
        phone: '+62 811-2345-6789',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60',
      },
    ]).onConflictDoNothing();

    // 2. Locations
    console.log('Inserting Locations...');
    await db.insert(schema.locations).values([
      { id: 'loc-1', name: 'Gedung A - Lantai 1', building: 'Gedung A', floor: 'Lantai 1', description: 'Ruang Pelayanan, Lobby, dan Area Kerja Utama', deviceCount: 5 },
      { id: 'loc-2', name: 'Gedung A - Lantai 2', building: 'Gedung A', floor: 'Lantai 2', description: 'Ruang Direksi, Ruang Rapat, dan Finance', deviceCount: 4 },
      { id: 'loc-3', name: 'Data Center & Server Room', building: 'Gedung A', floor: 'Basement', description: 'Rak Server Utama, Core Switch, Router Gateway, UPS', deviceCount: 6 },
      { id: 'loc-4', name: 'Gedung B - Lantai 1', building: 'Gedung B', floor: 'Lantai 1', description: 'Gudang & Divisi Operasional Logistik', deviceCount: 3 },
      { id: 'loc-5', name: 'Area Outdoor & Pos Jaga', building: 'Outdoor', floor: 'Ground', description: 'Access Point Luar & CCTV perimeter', deviceCount: 2 },
    ]).onConflictDoNothing();

    // 3. Devices
    console.log('Inserting Devices...');
    await db.insert(schema.devices).values([
      {
        id: 'dev-1',
        name: 'MikroTik CCR2004 (Core Gateway)',
        type: 'router',
        ipAddress: '192.168.1.1',
        macAddress: '48:8F:5A:11:22:33',
        model: 'MikroTik CCR2004-16G-2S+',
        locationId: 'loc-3',
        locationName: 'Data Center & Server Room',
        isPriority: true,
        status: 'online',
        uptime: '45 hari 12 jam',
        cpuUsage: 28,
        ramUsage: 45,
        storageUsage: 30,
        temperature: 41,
        latency: 1,
        packetLoss: 0,
        parentDeviceId: null,
        snmpVersion: 'v2c',
        snmpCommunity: 'public_nms',
        coordX: 400,
        coordY: 80,
      },
      {
        id: 'dev-2',
        name: 'Cisco CBS350 Core Switch 24-Port',
        type: 'switch',
        ipAddress: '192.168.1.2',
        macAddress: '00:26:0B:AA:BB:CC',
        model: 'Cisco Business 350 Managed 24G',
        locationId: 'loc-3',
        locationName: 'Data Center & Server Room',
        isPriority: true,
        status: 'online',
        uptime: '45 hari 11 jam',
        cpuUsage: 15,
        ramUsage: 38,
        storageUsage: 22,
        temperature: 38,
        latency: 1,
        packetLoss: 0,
        parentDeviceId: 'dev-1',
        snmpVersion: 'v2c',
        snmpCommunity: 'public_nms',
        coordX: 400,
        coordY: 200,
      },
      {
        id: 'dev-6',
        name: 'UniFi AP Lobby & Pelayanan (Lt.1)',
        type: 'access_point',
        ipAddress: '192.168.10.15',
        macAddress: '70:A7:41:44:55:66',
        model: 'UniFi U6 Pro Enterprise',
        locationId: 'loc-1',
        locationName: 'Gedung A - Lantai 1',
        isPriority: true,
        status: 'warning',
        uptime: '12 hari 4 jam',
        cpuUsage: 78,
        ramUsage: 82,
        storageUsage: 40,
        temperature: 49,
        latency: 28,
        packetLoss: 2,
        parentDeviceId: 'dev-4',
        snmpVersion: 'v2c',
        snmpCommunity: 'public_nms',
        coordX: 180,
        coordY: 500,
      },
      {
        id: 'dev-9',
        name: 'Switch Distribusi Gedung B',
        type: 'switch',
        ipAddress: '192.168.1.30',
        macAddress: '00:1E:13:EE:90:77',
        model: 'Cisco Catalyst 2960-24TT',
        locationId: 'loc-4',
        locationName: 'Gedung B - Lantai 1',
        isPriority: false,
        status: 'offline',
        uptime: '0 menit (Down)',
        cpuUsage: 0,
        ramUsage: 0,
        storageUsage: 0,
        temperature: 0,
        latency: 999,
        packetLoss: 100,
        parentDeviceId: 'dev-2',
        snmpVersion: 'v2c',
        snmpCommunity: 'public_nms',
        coordX: 700,
        coordY: 340,
      },
    ]).onConflictDoNothing();

    // 4. Alerts
    console.log('Inserting Alerts...');
    await db.insert(schema.alerts).values([
      {
        id: 'alt-1',
        deviceId: 'dev-9',
        deviceName: 'Switch Distribusi Gedung B',
        ipAddress: '192.168.1.30',
        message: 'Koneksi ICMP ping putus total (Host Unreachable). Kemungkinan power failure.',
        severity: 'critical',
        acknowledged: false,
      },
      {
        id: 'alt-2',
        deviceId: 'dev-6',
        deviceName: 'UniFi AP Lobby & Pelayanan (Lt.1)',
        ipAddress: '192.168.10.15',
        message: 'Beban client melebihi 65 user bersamaan. CPU Load mencapai 78%.',
        severity: 'warning',
        acknowledged: true,
        acknowledgedBy: 'Dimas Prakoso',
      },
    ]).onConflictDoNothing();

    // 5. AI Optimizer Config
    console.log('Inserting AI Config...');
    await db.insert(schema.aiConfigs).values({
      id: 'default_config',
      provider: 'google_gemini',
      model: 'gemini-2.5-flash',
      apiKey: 'AIzaSyD-NOC-NMS-DEMO-SECURE-KEY-9948271',
      temperature: 0.2,
      maxTokens: 4096,
      autoScanEnabled: true,
      autoScanIntervalMinutes: 15,
      autoGenerateScripts: true,
      notifyOnAnomaly: true,
      connectionStatus: 'connected',
    }).onConflictDoNothing();

    console.log('✅ NMS Database Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    process.exit(0);
  }
}

seed();
