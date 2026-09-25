import { NextRequest, NextResponse } from 'next/server';
import {
  getTelegramConfig,
  sendTestTelegramAlert,
  dispatchIncidentAlert,
} from '@/lib/telegram-alert';

export async function GET() {
  try {
    const config = getTelegramConfig();
    return NextResponse.json({
      success: true,
      configured: config.isEnabled,
      botUsername: '@nms_sundaya_bot',
      chatIdConfigured: Boolean(config.chatId),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'test';

    if (action === 'test') {
      const result = await sendTestTelegramAlert(body.chatId);
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Pesan uji coba Telegram berhasil dikirimkan!',
          messageId: result.messageId,
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error || 'Gagal mengirim pesan Telegram' },
          { status: 400 }
        );
      }
    }

    if (action === 'incident') {
      const result = await dispatchIncidentAlert({
        deviceId: body.deviceId || 'dev-test',
        deviceName: body.deviceName || 'MikroTik-Router',
        ipAddress: body.ipAddress || '192.168.1.1',
        metricName: body.metricName || 'cpu',
        metricLabel: body.metricLabel || 'Beban CPU',
        currentValue: body.currentValue || 92,
        condition: body.condition || '>=',
        threshold: body.threshold || 85,
        severity: body.severity || 'critical',
        ruleName: body.ruleName || 'Uji Coba Peringatan Kritis',
        unit: body.unit || '%',
      });

      return NextResponse.json({
        success: result.sent,
        reason: result.reason,
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
