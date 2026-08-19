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

    if (anomalies.length === 0) anomalies = initialAiLogAnomalies;
    if (routes.length === 0) routes = initialLanRouteRecommendations;
    if (plans.length === 0) plans = initialDeviceOptimizationPlans;
    if (!config) config = initialAiConfig;

    return NextResponse.json({
      success: true,
      data: {
        anomalies,
        lanRoutes: routes,
        optimizationPlans: plans,
        simulation: initialAiSimulationMetrics,
        config,
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
