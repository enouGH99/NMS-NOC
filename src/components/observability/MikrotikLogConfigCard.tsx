'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, ShieldAlert, Cpu } from 'lucide-react';

export const MikrotikLogConfigCard: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const mikrotikScript = `/system logging action add name=promtail-syslog target=remote remote=192.168.100.226 remote-port=5140 src-address=192.168.3.1 bsd-syslog=yes
/system logging add topics=critical action=promtail-syslog
/system logging add topics=error action=promtail-syslog
/system logging add topics=warning action=promtail-syslog
/system logging add topics=firewall action=promtail-syslog
/system logging add topics=dhcp action=promtail-syslog
/system logging add topics=account action=promtail-syslog
/system logging add topics=l2tp action=promtail-syslog
/system logging add topics=wireguard action=promtail-syslog`;

  const promtailConfig = `scrape_configs:
  - job_name: mikrotik-syslog
    syslog:
      listen_address: 0.0.0.0:5140
      idle_timeout: 60s
      label_structured_data: yes
      labels:
        job: "mikrotik"
        host: "192.168.3.1"
    relabel_configs:
      - source_labels: ['__syslog_message_severity']
        target_label: 'level'
      - source_labels: ['__syslog_message_facility']
        target_label: 'facility'`;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. MikroTik RouterOS Syslog Generator */}
      <div className="p-5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-m3-lg bg-sky-500/10 text-sky-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-m3-on-surface">
                1-Click RouterOS Syslog Configuration (MikroTik)
              </h3>
              <p className="text-xs text-m3-on-surface-variant">
                Kirim seluruh log firewall, DHCP, VPN, dan sistem MikroTik secara realtime ke Grafana Loki
              </p>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(mikrotikScript, 'mt')}
            className="px-3 py-1.5 rounded-m3-lg bg-m3-primary text-m3-on-primary text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all shadow-sm"
          >
            {copiedSection === 'mt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'mt' ? 'Tersalin!' : 'Salin Skrip Winbox'}</span>
          </button>
        </div>

        <div className="relative rounded-m3-xl bg-[#090d16] border border-[#1e293b] p-3.5 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre className="leading-relaxed">{mikrotikScript}</pre>
        </div>
      </div>

      {/* 2. Promtail Syslog Receiver Configuration */}
      <div className="p-5 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-m3-lg bg-purple-500/10 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-m3-on-surface">
                Promtail / Vector Syslog Receiver Config (Server Loki)
              </h3>
              <p className="text-xs text-m3-on-surface-variant">
                Konfigurasi Promtail pada server <code className="text-purple-400 font-mono text-[11px]">192.168.100.226</code> untuk menangkap Syslog UDP Port 5140
              </p>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(promtailConfig, 'promtail')}
            className="px-3 py-1.5 rounded-m3-lg bg-m3-surface-container-high text-m3-on-surface text-xs font-bold flex items-center gap-1.5 hover:bg-m3-on-surface/8 transition-all"
          >
            {copiedSection === 'promtail' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'promtail' ? 'Tersalin!' : 'Salin YAML'}</span>
          </button>
        </div>

        <div className="relative rounded-m3-xl bg-[#090d16] border border-[#1e293b] p-3.5 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre className="leading-relaxed">{promtailConfig}</pre>
        </div>
      </div>
    </div>
  );
};
