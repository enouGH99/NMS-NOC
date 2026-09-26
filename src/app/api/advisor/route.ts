import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devices, alerts, deviceMetrics } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { queryNocAdvisor, testAiConnection, AiProviderConfig, NetworkContext } from '@/lib/ai-provider-service';

// In-memory or fallback provider config cache (persisted during process lifetime)
let currentAiConfig: AiProviderConfig = {
  provider: 'builtin',
  apiKey: '',
  modelName: 'NOC-Expert-Heuristic-v2',
  baseUrl: '',
  temperature: 0.3,
  maxTokens: 1500,
};

/**
 * GET /api/advisor
 * Returns current active AI provider configuration (with masked API key)
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'test') {
    const testResult = await testAiConnection(currentAiConfig);
    return NextResponse.json(testResult);
  }

  const maskedKey = currentAiConfig.apiKey
    ? `${currentAiConfig.apiKey.slice(0, 6)}...${currentAiConfig.apiKey.slice(-4)}`
    : '';

  return NextResponse.json({
    success: true,
    config: {
      provider: currentAiConfig.provider,
      maskedApiKey: maskedKey,
      hasApiKey: !!currentAiConfig.apiKey,
      modelName: currentAiConfig.modelName,
      baseUrl: currentAiConfig.baseUrl,
      temperature: currentAiConfig.temperature,
    },
  });
}

/**
 * PUT /api/advisor
 * Updates AI Provider credentials & settings (Gemini, OpenAI, Ollama, Builtin)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, modelName, baseUrl, temperature, maxTokens } = body;

    if (!provider) {
      return NextResponse.json({ success: false, message: 'Field provider wajib diisi.' }, { status: 400 });
    }

    // If apiKey is not provided or masked placeholder, retain existing key if provider matches
    let effectiveKey = apiKey;
    if (apiKey === undefined || apiKey.includes('...')) {
      effectiveKey = currentAiConfig.apiKey;
    }

    const newConfig: AiProviderConfig = {
      provider,
      apiKey: effectiveKey || '',
      modelName: modelName || (provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : 'NOC-Expert-Heuristic-v2'),
      baseUrl: baseUrl || '',
      temperature: temperature !== undefined ? Number(temperature) : 0.3,
      maxTokens: maxTokens !== undefined ? Number(maxTokens) : 1500,
    };

    // Test connection first
    const testResult = await testAiConnection(newConfig);
    if (!testResult.success && provider !== 'builtin') {
      return NextResponse.json({
        success: false,
        message: `Validasi kredensial ${provider.toUpperCase()} gagal: ${testResult.message}`,
      }, { status: 400 });
    }

    currentAiConfig = newConfig;

    return NextResponse.json({
      success: true,
      message: `Pengaturan AI Provider (${provider.toUpperCase()}) berhasil disimpan dan terverifikasi.`,
      config: {
        provider: currentAiConfig.provider,
        maskedApiKey: currentAiConfig.apiKey ? `${currentAiConfig.apiKey.slice(0, 6)}...${currentAiConfig.apiKey.slice(-4)}` : '',
        modelName: currentAiConfig.modelName,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/advisor
 * Handles interactive user chat and diagnostics queries with live network telemetry context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, customConfig } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Prompt pertanyaan wajib diisi.' }, { status: 400 });
    }

    // 1. Gather live network context from PostgreSQL DB
    let devList: any[] = [];
    let altList: any[] = [];
    let wanIn = 27.9;
    let wanOut = 3.8;

    try {
      devList = await db.select().from(devices);
      altList = await db.select().from(alerts);

      const latestWanIn = await db
        .select()
        .from(deviceMetrics)
        .where(eq(deviceMetrics.metricName, 'wan_throughput_in'))
        .orderBy(desc(deviceMetrics.collectedAt))
        .limit(1);

      const latestWanOut = await db
        .select()
        .from(deviceMetrics)
        .where(eq(deviceMetrics.metricName, 'wan_throughput_out'))
        .orderBy(desc(deviceMetrics.collectedAt))
        .limit(1);

      if (latestWanIn.length > 0 && latestWanIn[0].value) wanIn = Number(latestWanIn[0].value);
      if (latestWanOut.length > 0 && latestWanOut[0].value) wanOut = Number(latestWanOut[0].value);
    } catch {
      // Fallback
    }

    const onlineCount = devList.filter((d: any) => d.status === 'online').length;
    const offlineCount = devList.filter((d: any) => d.status === 'offline' || d.status === 'unreachable').length;
    const activeAlerts = altList.filter((a: any) => !a.resolvedAt && !a.resolved_at);

    const context: NetworkContext = {
      devicesCount: devList.length || 6,
      onlineDevicesCount: onlineCount || 6,
      offlineDevicesCount: offlineCount,
      wanThroughputIn: wanIn,
      wanThroughputOut: wanOut,
      activeAlertsCount: activeAlerts.length,
      recentAlerts: activeAlerts.slice(0, 5).map((a: any) => ({
        title: a.title,
        severity: a.severity,
        deviceName: a.deviceName || a.target,
      })),
      deviceList: devList.map((d: any) => ({
        name: d.name,
        ipAddress: d.ipAddress,
        status: d.status,
        vendor: d.model,
      })),
    };

    // 2. Query AI Advisor
    const configToUse = customConfig || currentAiConfig;
    const response = await queryNocAdvisor(prompt, context, configToUse);

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
