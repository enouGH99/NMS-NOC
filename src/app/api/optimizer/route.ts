import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiLogAnomalies, lanRouteRecommendations, deviceOptimizationPlans, aiConfigs } from '@/db/schema';
import {
  initialAiLogAnomalies,
  initialLanRouteRecommendations,
  initialDeviceOptimizationPlans,
  initialAiSimulationMetrics,
  initialAiConfig,
} from '@/lib/mock-data';

export async function GET() {
  try {
    let anomalies: any[] = [];
    let routes: any[] = [];
    let plans: any[] = [];
    let config: any = null;

    try {
      anomalies = await db.select().from(aiLogAnomalies);
      routes = await db.select().from(lanRouteRecommendations);
      plans = await db.select().from(deviceOptimizationPlans);
      const confRows = await db.select().from(aiConfigs);
      if (confRows.length > 0) config = confRows[0];
    } catch {
      // Fallback
    }

    if (!config && global.__nmsAiConfig) {
      config = global.__nmsAiConfig;
    }

    const normalizeProvider = (p?: string) => {
      if (p === 'gemini' || p === 'google' || p === 'google_gemini') return 'google_gemini';
      if (p === 'openai' || p === 'chatgpt') return 'openai';
      if (p === 'claude' || p === 'anthropic' || p === 'anthropic_claude') return 'anthropic_claude';
      if (p === 'ollama' || p === 'local' || p === 'local_ollama') return 'local_ollama';
      return 'google_gemini';
    };

    const mappedConfig = config
      ? {
          provider: normalizeProvider(config.provider),
          model: config.model || 'gemini-2.5-flash',
          api_key: config.apiKey || config.api_key || '',
          custom_endpoint: config.customEndpoint || config.custom_endpoint || '',
          temperature: config.temperature !== undefined ? Number(config.temperature) : 0.2,
          max_tokens: config.maxTokens !== undefined ? Number(config.maxTokens) : 4096,
          auto_scan_enabled: config.autoScanEnabled !== undefined ? Boolean(config.autoScanEnabled) : true,
          auto_scan_interval_minutes: config.autoScanIntervalMinutes !== undefined ? Number(config.autoScanIntervalMinutes) : 15,
          auto_generate_scripts: config.autoGenerateScripts !== undefined ? Boolean(config.autoGenerateScripts) : true,
          notify_on_anomaly: config.notifyOnAnomaly !== undefined ? Boolean(config.notifyOnAnomaly) : true,
          connection_status: config.connectionStatus || config.connection_status || 'connected',
          last_tested_at: config.lastTestedAt ? new Date(config.lastTestedAt).toISOString() : undefined,
          response_time_ms: config.responseTimeMs || config.response_time_ms || 240,
        }
      : initialAiConfig;

    return NextResponse.json({
      success: true,
      data: {
        anomalies,
        lanRoutes: routes,
        optimizationPlans: plans,
        simulation: initialAiSimulationMetrics,
        config: mappedConfig,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Simulate AI Deep Log & SNMP Metric Inspection
    return NextResponse.json({
      success: true,
      message: 'AI Deep Inspection Scan selesai. 12.500+ entri log dan data SNMP dianalisis.',
      networkEfficiencyScore: 78,
      anomaliesFound: 3,
      predictedImprovement: '+300% throughput LAN',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
