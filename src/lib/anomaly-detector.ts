/**
 * Network Telemetry & Log Anomaly Detector (AIOps Engine)
 * Analyzes real-time SNMP rates, latency, packet drops, and Loki syslog streams.
 */

export interface NetworkAnomaly {
  id: string;
  type: 'traffic_spike' | 'queue_saturation' | 'brute_force' | 'flapping' | 'cpu_spike' | 'dhcp_exhaustion';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedTarget: string;
  anomalyScore: number; // 0 - 100
  rootCause: string;
  suggestedAction: string;
  detectedAt: string;
}

export interface AnomalyReport {
  overallHealthScore: number; // 0 - 100 (100 = perfect health)
  overallAnomalyScore: number; // 0 - 100 (0 = no anomaly)
  status: 'healthy' | 'warning' | 'critical';
  anomalies: NetworkAnomaly[];
  summary: string;
  analyzedAt: string;
}

/**
 * Run heuristic anomaly detection across live telemetry parameters and log lines
 */
export function detectNetworkAnomalies(options: {
  wanInboundMbps?: number;
  wanOutboundMbps?: number;
  wanMaxCapacityMbps?: number;
  cpuLoadPercent?: number;
  memoryUsagePercent?: number;
  offlineDeviceCount?: number;
  activeAlertCount?: number;
  recentLogs?: { message: string; timestamp: string; level?: string }[];
}): AnomalyReport {
  const anomalies: NetworkAnomaly[] = [];
  const now = new Date().toISOString();

  const wanIn = options.wanInboundMbps ?? 27.9;
  const wanOut = options.wanOutboundMbps ?? 3.8;
  const maxCap = options.wanMaxCapacityMbps ?? 100.0;
  const cpu = options.cpuLoadPercent ?? 18;
  const offlineCount = options.offlineDeviceCount ?? 0;
  const alertCount = options.activeAlertCount ?? 0;
  const logs = options.recentLogs || [];

  // 1. WAN Utilization & Saturation Check
  const wanUtilization = (wanIn / maxCap) * 100;
  if (wanUtilization >= 85) {
    anomalies.push({
      id: `anom-wan-sat-${Date.now()}`,
      type: 'queue_saturation',
      severity: wanUtilization >= 95 ? 'critical' : 'warning',
      title: 'Trafik WAN Mendekati Kapasitas Maksimum (Saturation)',
      description: `Throughput Download WAN ether1 mencapai ${wanIn.toFixed(1)} Mbps (${wanUtilization.toFixed(1)}% dari kapasitas ${maxCap} Mbps).`,
      affectedTarget: 'MikroTik ether1 (WAN)',
      anomalyScore: Math.min(100, Math.round(wanUtilization)),
      rootCause: 'Konsumsi bandwidth masif oleh multiple clients atau adanya unduhan besar simultan tanpa dynamic queue limit.',
      suggestedAction: 'Aktifkan QoS Queue Tree PCQ atau terapkan limitasi burst rate pada subnet klien terbesar.',
      detectedAt: now,
    });
  }

  // 2. CPU Overload Check
  if (cpu >= 80) {
    anomalies.push({
      id: `anom-cpu-spike-${Date.now()}`,
      type: 'cpu_spike',
      severity: cpu >= 90 ? 'critical' : 'warning',
      title: 'Beban CPU Router Tinggi',
      description: `Penggunaan CPU utama router MikroTik berada pada angka ${cpu}%.`,
      affectedTarget: 'Core Router CPU',
      anomalyScore: cpu,
      rootCause: 'Beban connection tracking tinggi, rule firewall tanpa FastTrack, atau proses scan jaringan intensif.',
      suggestedAction: 'Periksa /tool profile di WinBox dan aktifkan FastTrack untuk koneksi established/related.',
      detectedAt: now,
    });
  }

  // 3. Node Outages Check
  if (offlineCount > 0) {
    anomalies.push({
      id: `anom-node-down-${Date.now()}`,
      type: 'flapping',
      severity: offlineCount >= 2 ? 'critical' : 'warning',
      title: `${offlineCount} Perangkat Jaringan Tidak Terjangkau (Down)`,
      description: `Terdapat ${offlineCount} node yang tidak merespon SNMP/ICMP ping poll.`,
      affectedTarget: 'Multiple Network Nodes',
      anomalyScore: Math.min(100, offlineCount * 30),
      rootCause: 'Kemungkinan putusnya link fisik (kabel UTP/SFP) atau matinya pasokan daya PoE/listrik pada switch/AP terkait.',
      suggestedAction: 'Periksa status port fisik pada switch distribusi dan lakukan verifikasi catu daya PoE.',
      detectedAt: now,
    });
  }

  // 4. Log Inspection for Attack Patterns & Flapping (Syslog / Loki)
  let bruteForceCount = 0;
  let flappingCount = 0;
  let dhcpExhaustCount = 0;

  logs.forEach((log) => {
    const msg = log.message.toLowerCase();
    if (msg.includes('login failure') || msg.includes('authentication failed') || msg.includes('ssh password check failed')) {
      bruteForceCount++;
    }
    if (msg.includes('link down') || msg.includes('link up') || msg.includes('flapping')) {
      flappingCount++;
    }
    if (msg.includes('pool exhausted') || msg.includes('no free address')) {
      dhcpExhaustCount++;
    }
  });

  if (bruteForceCount >= 3) {
    anomalies.push({
      id: `anom-brute-force-${Date.now()}`,
      type: 'brute_force',
      severity: 'critical',
      title: 'Terdeteksi Pola Percobaan Brute-Force Login',
      description: `Ditemukan ${bruteForceCount} log kegagalan autentikasi SSH/WinBox dalam jendela waktu singkat.`,
      affectedTarget: 'Management Service (Port 22/8291)',
      anomalyScore: 88,
      rootCause: 'Upaya penetrasi otomatis (bot scanner) terhadap service manajemen router publik.',
      suggestedAction: 'Terapkan rule firewall RAW Drop Brute-Force dan batasi akses Winbox hanya dari subnet NOC.',
      detectedAt: now,
    });
  }

  if (flappingCount >= 4) {
    anomalies.push({
      id: `anom-flap-${Date.now()}`,
      type: 'flapping',
      severity: 'warning',
      title: 'Indikasi Interface Link Flapping',
      description: `Terdeteksi siklus Link Up/Down berulang sebanyak ${flappingCount} kali pada antarmuka jaringan.`,
      affectedTarget: 'Switch Port / Radio Wireless',
      anomalyScore: 72,
      rootCause: 'Kabel patch cord longgar, interferensi sinyal radio nirkabel, atau negosiasi auto-speed yang tidak stabil.',
      suggestedAction: 'Lock speed/duplex interface secara statis (1000M Full Duplex) dan ganti patch cord fisik.',
      detectedAt: now,
    });
  }

  if (dhcpExhaustCount > 0) {
    anomalies.push({
      id: `anom-dhcp-${Date.now()}`,
      type: 'dhcp_exhaustion',
      severity: 'warning',
      title: 'Alokasi IP Address DHCP Pool Hampir Habis',
      description: `Ditemukan log DHCP server kehabisan IP sewa bebas untuk host baru.`,
      affectedTarget: 'MikroTik DHCP Server',
      anomalyScore: 65,
      rootCause: 'Lease time DHCP terlalu panjang atau kapasitas subnet IP (/24) tidak mencukupi lonjakan perangkat tamu/tamu WiFi.',
      suggestedAction: 'Perpendek lease time DHCP menjadi 1-2 jam dan perluas subnet pool ke /23 jika diperlukan.',
      detectedAt: now,
    });
  }

  // Calculate Aggregated Health & Anomaly Score
  let maxScore = 0;
  let totalScore = 0;

  if (anomalies.length > 0) {
    anomalies.forEach((a) => {
      totalScore += a.anomalyScore;
      if (a.anomalyScore > maxScore) maxScore = a.anomalyScore;
    });
  }

  const overallAnomalyScore = Math.min(100, Math.round(maxScore * 0.7 + (totalScore / (anomalies.length || 1)) * 0.3));
  const overallHealthScore = Math.max(0, 100 - overallAnomalyScore);

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (overallAnomalyScore >= 70) {
    status = 'critical';
  } else if (overallAnomalyScore >= 35) {
    status = 'warning';
  }

  const summary =
    status === 'healthy'
      ? 'Kondisi telemetri jaringan stabil. Tidak ditemukan anomali trafik ataupun percobaan serangan pada log sistem.'
      : status === 'warning'
      ? `Terdeteksi ${anomalies.length} anomali dengan tingkat keparahan sedang. Disarankan penyesuaian parameter konfigurasi.`
      : `PERHATIAN: Ditemukan ${anomalies.length} anomali kritis yang memerlukan penanganan dan mitigasi segera oleh tim NOC.`;

  return {
    overallHealthScore,
    overallAnomalyScore,
    status,
    anomalies,
    summary,
    analyzedAt: now,
  };
}
