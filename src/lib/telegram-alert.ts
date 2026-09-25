/**
 * Telegram Alerting & Incident Notification Engine
 * NMS NOC Platform — SUNDAYA IT Infrastructure
 *
 * Dispatches real-time incident and recovery notifications to IT Admins
 * via Telegram Bot API with anti-spam cooldown and deduplication.
 */

export interface IncidentAlertPayload {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  metricName: string;
  metricLabel: string;
  currentValue: number | string;
  condition: string;
  threshold: number | string;
  severity: 'critical' | 'warning' | 'info';
  ruleName: string;
  unit?: string;
  timestamp?: Date;
}

export interface RecoveryAlertPayload {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  metricName: string;
  metricLabel: string;
  currentValue: number | string;
  ruleName: string;
  unit?: string;
  timestamp?: Date;
}

// In-memory cooldown cache: alertKey -> timestamp of last notification sent
// Prevents alert storming / flooding the Telegram group
const alertCooldownMap = new Map<string, number>();
const COOLDOWN_DURATION_MS = 15 * 60 * 1000; // 15 minutes cooldown for identical alert

/**
 * Get configured Telegram credentials
 */
export function getTelegramConfig() {
  const token =
    process.env.TELEGRAM_BOT_TOKEN || '8753633028:AAGojv1wb8SPxgonLN6xkyxgpCMfnIhqgjk';
  const chatId = process.env.TELEGRAM_CHAT_ID || '1777492435';
  const isEnabled = Boolean(token && chatId);

  return { token, chatId, isEnabled };
}

/**
 * Low-level sender: Sends formatted HTML message to Telegram Bot API
 */
export async function sendTelegramMessage(
  htmlMessage: string,
  targetChatId?: string
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const { token, chatId: defaultChatId, isEnabled } = getTelegramConfig();
  const chatId = targetChatId || defaultChatId;

  if (!isEnabled || !token || !chatId) {
    return { success: false, error: 'Telegram Bot Token atau Chat ID belum dikonfigurasi.' };
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      // Fast timeout to avoid blocking main poller loop
      signal: AbortSignal.timeout(6000),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.warn('[Telegram Alert] API Error:', result.description || response.statusText);
      return { success: false, error: result.description || 'Gagal mengirim pesan Telegram' };
    }

    return { success: true, messageId: result.result?.message_id };
  } catch (err: any) {
    console.warn('[Telegram Alert] Connection Error:', err.message);
    return { success: false, error: err.message || 'Timeout / Connection failed' };
  }
}

/**
 * Format and send an Incident Alert
 */
export async function dispatchIncidentAlert(
  payload: IncidentAlertPayload
): Promise<{ sent: boolean; reason?: string }> {
  const alertKey = `${payload.deviceId}:${payload.metricName}:${payload.ruleName}`;
  const now = Date.now();
  const lastSent = alertCooldownMap.get(alertKey);

  // Anti-Spam Check: Don't resend identical active alert within cooldown window
  if (lastSent && now - lastSent < COOLDOWN_DURATION_MS) {
    const remainingMin = Math.ceil((COOLDOWN_DURATION_MS - (now - lastSent)) / 60000);
    return { sent: false, reason: `Alert dalam masa cooldown (tersisa ${remainingMin} menit)` };
  }

  const isCritical = payload.severity === 'critical';
  const icon = isCritical ? '🚨' : '⚠️';
  const severityBadge = isCritical ? '🔴 <b>CRITICAL</b>' : '🟡 <b>WARNING</b>';
  const timeStr = (payload.timestamp || new Date()).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const unitStr = payload.unit ? ` ${payload.unit}` : '';

  const message = [
    `${icon} <b>NMS NOC ALERT: ${payload.ruleName.toUpperCase()}</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📊 <b>Severity:</b> ${severityBadge}`,
    `🖥️ <b>Perangkat:</b> <code>${payload.deviceName}</code>`,
    `🌐 <b>IP Address:</b> <code>${payload.ipAddress}</code>`,
    `📈 <b>Metrik:</b> ${payload.metricLabel || payload.metricName}`,
    `⚡ <b>Nilai Terdeteksi:</b> <b>${payload.currentValue}${unitStr}</b>`,
    `🎯 <b>Batas Ambang:</b> ${payload.condition} ${payload.threshold}${unitStr}`,
    `⏰ <b>Waktu:</b> ${timeStr} WIB`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `👉 <i>Segera lakukan pengecekan pada dashboard NMS NOC.</i>`,
  ].join('\n');

  const res = await sendTelegramMessage(message);

  if (res.success) {
    alertCooldownMap.set(alertKey, now);
    return { sent: true };
  }

  return { sent: false, reason: res.error };
}

/**
 * Format and send a Recovery Alert when incident resolves
 */
export async function dispatchRecoveryAlert(
  payload: RecoveryAlertPayload
): Promise<{ sent: boolean; reason?: string }> {
  const alertKey = `${payload.deviceId}:${payload.metricName}:${payload.ruleName}`;

  // Clear cooldown so if it breaks again, immediate notification will trigger
  alertCooldownMap.delete(alertKey);

  const timeStr = (payload.timestamp || new Date()).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
  const unitStr = payload.unit ? ` ${payload.unit}` : '';

  const message = [
    `✅ <b>NMS NOC RECOVERED: ${payload.ruleName.toUpperCase()}</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🟢 <b>Status:</b> <b>NORMAL / RESOLVED</b>`,
    `🖥️ <b>Perangkat:</b> <code>${payload.deviceName}</code>`,
    `🌐 <b>IP Address:</b> <code>${payload.ipAddress}</code>`,
    `📈 <b>Metrik:</b> ${payload.metricLabel || payload.metricName}`,
    `⚡ <b>Nilai Saat Ini:</b> <b>${payload.currentValue}${unitStr}</b>`,
    `⏰ <b>Waktu Pulih:</b> ${timeStr} WIB`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `✨ <i>Perangkat telah beroperasi kembali dalam batas aman.</i>`,
  ].join('\n');

  const res = await sendTelegramMessage(message);
  return { sent: res.success, reason: res.error };
}

/**
 * Send a Test Alert from UI Settings
 */
export async function sendTestTelegramAlert(targetChatId?: string) {
  const nowStr = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const message = [
    `🔔 <b>NMS NOC — UJI COBA NOTIFIKASI TELEGRAM</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🟢 <b>Status:</b> <b>Koneksi Bot Berhasil 100%!</b>`,
    `🏢 <b>Sistem:</b> NMS NOC Platform (SUNDAYA)`,
    `🤖 <b>Bot Name:</b> <code>@nms_sundaya_bot</code>`,
    `⏰ <b>Waktu Uji:</b> ${nowStr} WIB`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `✨ <i>Notifikasi insiden kritis (CPU, RAM, Suhu, Link Down) akan otomatis dikirimkan ke chat ini secara real-time.</i>`,
  ].join('\n');

  return await sendTelegramMessage(message, targetChatId);
}
