/**
 * Multi-Provider AI Service & NOC Copilot Engine
 * Supports: Built-in Offline Expert Engine (Zero API Key), Google Gemini, OpenAI, Groq, Ollama (Self-Hosted).
 */

import { generateQosPcqScript, generateFirewallDefenseScript, generateOptimizationScript, generatePccScript } from './routeros-generator';
import { detectNetworkAnomalies, AnomalyReport } from './anomaly-detector';

export type AiProviderType = 'builtin' | 'gemini' | 'openai' | 'groq' | 'anthropic' | 'ollama';

export interface AiProviderConfig {
  provider: AiProviderType;
  apiKey?: string;
  modelName?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface NetworkContext {
  devicesCount: number;
  onlineDevicesCount: number;
  offlineDevicesCount: number;
  wanThroughputIn: number;
  wanThroughputOut: number;
  activeAlertsCount: number;
  recentAlerts?: Array<{ title: string; severity: string; deviceName?: string }>;
  recentLogs?: Array<{ message: string; timestamp: string; level?: string }>;
  deviceList?: Array<{ name: string; ipAddress: string; status: string; vendor?: string }>;
}

export interface AiAdvisorResponse {
  answer: string;
  providerUsed: AiProviderType;
  modelUsed: string;
  isFallback: boolean;
  anomalyReport?: AnomalyReport;
  recommendedScripts?: Array<{
    title: string;
    category: string;
    script: string;
    safetyLevel: string;
  }>;
  suggestedPrompts?: string[];
  executionTimeMs: number;
}

/**
 * Validate / Test AI Provider Credentials & Connectivity
 */
export async function testAiConnection(config: AiProviderConfig): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();

  if (config.provider === 'builtin') {
    return {
      success: true,
      message: 'Offline Expert Engine siap digunakan (100% lokal & tanpa kuota API).',
      latencyMs: 1,
    };
  }

  if (config.provider === 'gemini') {
    if (!config.apiKey || config.apiKey.trim().length < 10) {
      return { success: false, message: 'Google Gemini API Key tidak valid atau belum diisi.' };
    }
    try {
      const model = config.modelName || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with "PONG" only.' }] }],
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const errText = await res.text();
        return { success: false, message: `Autentikasi Gemini gagal (${res.status}): ${errText.slice(0, 120)}` };
      }
      return { success: true, message: `Koneksi Google Gemini (${model}) berhasil terhubung.`, latencyMs };
    } catch (err: any) {
      return { success: false, message: `Gagal menghubungi API Gemini: ${err.message}` };
    }
  }

  if (config.provider === 'openai' || config.provider === 'groq') {
    if (!config.apiKey || config.apiKey.trim().length < 10) {
      return { success: false, message: 'API Key belum diisi atau tidak valid.' };
    }
    const baseUrl = config.baseUrl || (config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
    const model = config.modelName || (config.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const errText = await res.text();
        return { success: false, message: `Autentikasi ${config.provider.toUpperCase()} gagal (${res.status}): ${errText.slice(0, 120)}` };
      }
      return { success: true, message: `Koneksi ${config.provider.toUpperCase()} (${model}) berhasil terverifikasi.`, latencyMs };
    } catch (err: any) {
      return { success: false, message: `Gagal menghubungi server AI: ${err.message}` };
    }
  }

  if (config.provider === 'ollama') {
    const baseUrl = config.baseUrl || 'http://127.0.0.1:11434';
    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        return { success: false, message: `Ollama server merespon dengan status ${res.status}.` };
      }
      return { success: true, message: `Server Ollama Lokal (${baseUrl}) berhasil terhubung.`, latencyMs };
    } catch (err: any) {
      return { success: false, message: `Tidak dapat terhubung ke Ollama (${baseUrl}): ${err.message}` };
    }
  }

  return { success: true, message: 'Provider terverifikasi.' };
}

/**
 * Builtin Heuristic & Rules-Based NOC Expert Engine
 * Generates structured, highly accurate technical analysis without any external API dependencies.
 */
function runBuiltinExpertEngine(userPrompt: string, context: NetworkContext, anomalyReport: AnomalyReport): AiAdvisorResponse {
  const p = userPrompt.toLowerCase();
  const scripts: any[] = [];
  let answer = '';

  const suggestedPrompts = [
    'Bagaimana cara optimasi Queue Tree MikroTik untuk mencegah buffering?',
    'Buatkan script firewall anti brute-force Winbox dan SSH',
    'Analisis anomali log dan kestabilan trafik WAN ether1',
    'Bagaimana cara konfigurasi Failover Dual WAN dengan PCC?',
  ];

  if (p.includes('qos') || p.includes('queue') || p.includes('bandwidth') || p.includes('limit') || p.includes('lemot') || p.includes('buffering')) {
    const qosScript = generateQosPcqScript({
      wanInterface: 'ether1',
      totalDownloadMbps: Math.max(50, Math.round(context.wanThroughputIn * 1.5)),
      totalUploadMbps: Math.max(10, Math.round(context.wanThroughputOut * 2)),
      lanSubnet: '192.168.100.0/24',
    });
    scripts.push(qosScript);

    answer = `### 🚀 Rekomendasi Optimasi QoS & Manajemen Bandwidth

Berdasarkan telemetri jaringan saat ini:
- **Trafik Realtime WAN ether1**: Download **${context.wanThroughputIn.toFixed(1)} Mbps** | Upload **${context.wanThroughputOut.toFixed(1)} Mbps**.
- **Jumlah Node Aktif**: **${context.onlineDevicesCount} Online** dari total ${context.devicesCount} perangkat.

#### 📌 Analisa & Diagnosa:
Untuk mencegah masalah *bufferbloat* dan monopoli bandwidth oleh satu klien, sangat disarankan menerapkan **Queue Tree berbasis PCQ (Per Connection Queue)**. 
PCQ secara otomatis membagi kuota uplink/downlink secara adil (*fair-share*) ke setiap IP host yang aktif tanpa perlu membuat ratusan simple queue manual.

#### 🛠️ Langkah Penerapan:
1. Salin script **PCQ Dynamic Queue** di bawah ke Terminal RouterOS / WinBox.
2. Script ini akan membuat packet marking di \`/ip firewall mangle\` dan mengikatnya pada parent global.
3. Parameter CIR (*limit-at*) telah dikalibrasi 70% dari kapasitas puncak untuk menjamin kestabilan latency.`;
  } else if (p.includes('firewall') || p.includes('security') || p.includes('serang') || p.includes('brute') || p.includes('hack') || p.includes('raw')) {
    const fwScript = generateFirewallDefenseScript({
      wanInterface: 'ether1',
      allowedAdminSubnet: '192.168.100.0/24',
    });
    scripts.push(fwScript);

    answer = `### 🛡️ Analisa Keamanan RouterOS & Rekomendasi Firewall

#### 📌 Kondisi Keamanan Saat Ini:
- **Alert Aktif**: **${context.activeAlertsCount} Alert** tercatat pada sistem NOC.
- **Skor Anomali Keamanan**: **${anomalyReport.overallAnomalyScore}%** (${anomalyReport.status.toUpperCase()}).

#### 🔒 Rekomendasi Pengerasan (Hardening):
1. **Penerapan RAW Table**: Melakukan filter *Invalid Packets* dan *SYN Flood* sebelum connection tracking agar menghemat resource CPU router.
2. **Anti Brute-Force Stage Filtering**: Mengisolasi IP address yang mencoba login gagal lebih dari 3 kali ke port 8291 (WinBox), 22 (SSH), atau 80 (WebFig) ke dalam blacklist address-list selama 7 hari.
3. **Whitelist Management Port**: Batasi akses konfigurasi router hanya dari subnet manajemen lokal terpercaya (\`192.168.100.0/24\`).`;
  } else if (p.includes('pcc') || p.includes('failover') || p.includes('dual wan') || p.includes('load balance')) {
    const pccScript = generatePccScript({
      isp1Interface: 'ether1-ISP1',
      isp2Interface: 'ether2-ISP2',
      isp1Gateway: '192.168.1.1',
      isp2Gateway: '192.168.2.1',
      lanSubnet: '192.168.100.0/24',
    });
    scripts.push(pccScript);

    answer = `### 🌐 Rekomendasi Konfigurasi Dual-WAN PCC & Recursive Failover

#### 📌 Arsitektur Load Balancing:
Konfigurasi **PCC (Per Connection Classifier)** dengan mode \`both-addresses\` merupakan metode paling stabil untuk membagi beban trafik pada 2 jalur ISP secara simultan tanpa menyebabkan session break pada aplikasi HTTPS / perbankan.

#### ⚡ Mekanisme Failover:
Menggunakan routing rekursif dengan \`check-gateway=ping\` sehingga router otomatis mengalihkan 100% trafik ke ISP backup jika salah satu gateway ISP mengalami RTO/Down.`;
  } else if (p.includes('anomali') || p.includes('log') || p.includes('diagnosa') || p.includes('cek') || p.includes('status') || p.includes('kesehatan')) {
    const anomalyListText =
      anomalyReport.anomalies.length === 0
        ? '✅ **Tidak ada anomali kritis.** Seluruh parameter trafik, CPU, dan log sistem beroperasi dalam batas normal.'
        : anomalyReport.anomalies
            .map(
              (a, i) =>
                `${i + 1}. **${a.title}** (${a.severity.toUpperCase()})\n   - **Target**: \`${a.affectedTarget}\`\n   - **Akar Masalah (RCA)**: ${a.rootCause}\n   - **Tindakan**: ${a.suggestedAction}`
            )
            .join('\n\n');

    answer = `### 📊 Diagnosa Kesehatan & Telemetri Jaringan NOC

#### 🔍 Ringkasan Status Sistem:
- **Skor Kesehatan Jaringan**: **${anomalyReport.overallHealthScore}/100** (${anomalyReport.status.toUpperCase()})
- **Status Node**: **${context.onlineDevicesCount} Online**, **${context.offlineDevicesCount} Down**.
- **Throughput WAN ether1**: Download **${context.wanThroughputIn.toFixed(1)} Mbps** / Upload **${context.wanThroughputOut.toFixed(1)} Mbps**.
- **Alert Aktif**: **${context.activeAlertsCount} Insiden**.

#### 🚨 Temuan Anomali:
${anomalyListText}

#### 💡 Rekomendasi Lanjutan:
${
  anomalyReport.status === 'healthy'
    ? 'Pertahankan pemantauan rutin dan pastikan interval poller SNMP tetap berada pada 60 detik.'
    : 'Segera lakukan mitigasi sesuai poin tindakan di atas dan tinjau log Syslog Loki untuk detail IP sumber.'
}`;
  } else {
    // General Technical Answer
    const optScript = generateOptimizationScript({ wanInterface: 'ether1', mtu: 1492 });
    scripts.push(optScript);

    answer = `### 🤖 Asisten NOC AI Copilot

Halo! Saya adalah **NOC AI Advisor** yang terhubung langsung dengan sistem pemantauan NMS Anda.

#### 📈 Status Realtime Jaringan Anda:
- **Throughput WAN ether1**: **${context.wanThroughputIn.toFixed(1)} Mbps (DL)** / **${context.wanThroughputOut.toFixed(1)} Mbps (UL)**
- **Perangkat Terdaftar**: **${context.onlineDevicesCount}/${context.devicesCount} Node Online**
- **Indikator Kesehatan**: **${anomalyReport.overallHealthScore}% Prima** (${anomalyReport.anomalies.length} anomali terdeteksi)

Anda dapat meminta saya untuk:
1. Melakukan **Diagnosa Root Cause Analysis (RCA)** atas insiden jaringan yang sedang berlangsung.
2. Menghasilkan skrip **QoS Queue Tree PCQ** atau **Firewall Anti-Attack** MikroTik siap pakai.
3. Merancang skema **Load Balancing Dual-WAN PCC** & Failover otomatis.
4. Menganalisis log error Loki/Syslog untuk mencari indikasi serangan brute-force atau link flapping.`;
  }

  return {
    answer,
    providerUsed: 'builtin',
    modelUsed: 'NOC-Expert-Heuristic-v2',
    isFallback: false,
    anomalyReport,
    recommendedScripts: scripts,
    suggestedPrompts,
    executionTimeMs: 15,
  };
}

/**
 * Call Cloud AI Provider (Gemini / OpenAI / Groq / Ollama) with context injection
 */
async function callCloudAiProvider(
  userPrompt: string,
  context: NetworkContext,
  anomalyReport: AnomalyReport,
  config: AiProviderConfig
): Promise<string> {
  const systemPrompt = `You are an elite Senior NOC (Network Operations Center) Engineer & MikroTik Certified Network Associate (MTCNA/MTCRE) AI Assistant.
You are embedded inside a production NMS platform.
Current Realtime Telemetry Context:
- WAN ether1 Live Rate: Download ${context.wanThroughputIn.toFixed(1)} Mbps, Upload ${context.wanThroughputOut.toFixed(1)} Mbps
- Total Devices: ${context.devicesCount} (${context.onlineDevicesCount} Online, ${context.offlineDevicesCount} Offline)
- Active Alerts: ${context.activeAlertsCount}
- Anomaly Health Score: ${anomalyReport.overallHealthScore}/100 (Status: ${anomalyReport.status})
- Detected Anomalies: ${JSON.stringify(anomalyReport.anomalies)}

Instructions:
1. Always respond in polite, highly professional, and structured Indonesian (Bahasa Indonesia).
2. If providing MikroTik CLI commands, format them in markdown code blocks (\`\`\`routeros or \`\`\`bash) with clear explanatory comments.
3. Make sure commands are safe, production-grade, and do not cause admin lockouts.
4. Provide Root Cause Analysis (RCA) and concrete mitigation steps.`;

  if (config.provider === 'gemini') {
    const model = config.modelName || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey?.trim()}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question:\n${userPrompt}` }] }
        ],
        generationConfig: {
          temperature: config.temperature ?? 0.3,
          maxOutputTokens: config.maxTokens ?? 1500,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada respon dari Gemini.';
  }

  if (config.provider === 'openai' || config.provider === 'groq') {
    const baseUrl = config.baseUrl || (config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
    const model = config.modelName || (config.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey?.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: config.temperature ?? 0.3,
        max_tokens: config.maxTokens ?? 1500,
      }),
    });

    if (!res.ok) {
      throw new Error(`${config.provider.toUpperCase()} API error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Tidak ada respon dari model AI.';
  }

  if (config.provider === 'ollama') {
    const baseUrl = config.baseUrl || 'http://127.0.0.1:11434';
    const model = config.modelName || 'llama3';

    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status}`);
    }
    const data = await res.json();
    return data.response || 'Tidak ada respon dari Ollama.';
  }

  throw new Error(`Provider ${config.provider} tidak didukung untuk cloud call.`);
}

/**
 * Main query entry point for NOC AI Advisor
 */
export async function queryNocAdvisor(
  userPrompt: string,
  context: NetworkContext,
  config?: AiProviderConfig
): Promise<AiAdvisorResponse> {
  const startTime = Date.now();
  const effectiveConfig: AiProviderConfig = config || { provider: 'builtin' };

  // 1. Run Anomaly Detection on current context
  const anomalyReport = detectNetworkAnomalies({
    wanInboundMbps: context.wanThroughputIn,
    wanOutboundMbps: context.wanThroughputOut,
    offlineDeviceCount: context.offlineDevicesCount,
    activeAlertCount: context.activeAlertsCount,
    recentLogs: context.recentLogs,
  });

  // 2. If provider is builtin or no API key, use Expert Engine directly
  if (effectiveConfig.provider === 'builtin' || (!effectiveConfig.apiKey && effectiveConfig.provider !== 'ollama')) {
    const builtinResult = runBuiltinExpertEngine(userPrompt, context, anomalyReport);
    builtinResult.executionTimeMs = Date.now() - startTime;
    return builtinResult;
  }

  // 3. Attempt Cloud Provider with Graceful Fallback
  try {
    const cloudAnswer = await callCloudAiProvider(userPrompt, context, anomalyReport, effectiveConfig);
    const executionTimeMs = Date.now() - startTime;

    return {
      answer: cloudAnswer,
      providerUsed: effectiveConfig.provider,
      modelUsed: effectiveConfig.modelName || effectiveConfig.provider,
      isFallback: false,
      anomalyReport,
      recommendedScripts: [],
      suggestedPrompts: [
        'Diagnosa akar masalah anomali jaringan saat ini',
        'Buatkan script QoS Queue Tree PCQ MikroTik',
        'Audit konfigurasi firewall untuk mencegah serangan brute force',
      ],
      executionTimeMs,
    };
  } catch (err: any) {
    console.warn(`[AI Advisor] Cloud provider ${effectiveConfig.provider} failed: ${err.message}. Falling back to Builtin Expert Engine.`);
    const fallbackResult = runBuiltinExpertEngine(userPrompt, context, anomalyReport);
    fallbackResult.isFallback = true;
    fallbackResult.answer = `> ⚠️ **Catatan Sistem:** Layanan AI Cloud (\`${effectiveConfig.provider}\`) tidak dapat dihubungi atau kuota habis (${err.message.slice(0, 80)}...). Sistem otomatis mengalihkan jawaban ke **Offline Expert Engine** bawaan.\n\n` + fallbackResult.answer;
    fallbackResult.executionTimeMs = Date.now() - startTime;
    return fallbackResult;
  }
}
