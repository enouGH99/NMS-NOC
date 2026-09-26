'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3Chip } from '@/components/m3/M3Chip';
import { AnomalyScoreRadar } from '@/components/advisor/AnomalyScoreRadar';
import { AiProviderModal } from '@/components/advisor/AiProviderModal';
import { RouterOsScriptModal } from '@/components/advisor/RouterOsScriptModal';
import { GeneratedScript } from '@/lib/routeros-generator';
import { AnomalyReport } from '@/lib/anomaly-detector';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Settings,
  Terminal,
  RefreshCw,
  Zap,
  Activity,
  Shield,
  Copy,
  Check,
  Radio,
  Cpu,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  providerUsed?: string;
  modelUsed?: string;
  isFallback?: boolean;
  executionTimeMs?: number;
  timestamp: string;
  recommendedScripts?: GeneratedScript[];
}

export default function AdvisorPage() {
  const { liveStats, throughputHistory, alerts } = useNms();
  const latestThroughput = throughputHistory[throughputHistory.length - 1] || {
    inbound: liveStats.currentInboundMbps || 27.9,
    outbound: liveStats.currentOutboundMbps || 3.8,
  };
  const activeAlerts = alerts.filter((a) => !a.resolved_at);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `### 🤖 Selamat Datang di NOC AI Advisor & Copilot

Saya adalah asisten cerdas NOC yang terhubung langsung dengan telemetri router, antrean QoS, log sistem Loki, dan alert aktif NMS Anda.

**Kondisi Jaringan Saat Ini:**
- **Trafik WAN ether1**: Download **${latestThroughput.inbound.toFixed(1)} Mbps** / Upload **${latestThroughput.outbound.toFixed(1)} Mbps**
- **Node Aktif**: **${liveStats.onlineCount} Online** (${liveStats.offlineCount} Down)
- **Insiden Terbuka**: **${activeAlerts.length} Alert Aktif**

Silakan ajukan pertanyaan seputar optimasi jaringan, diagnosa anomali, atau pilih prompt cepat di bawah.`,
      providerUsed: 'builtin',
      modelUsed: 'NOC-Expert-Heuristic-v2',
      timestamp: new Date().toLocaleTimeString('id-ID'),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [anomalyReport, setAnomalyReport] = useState<AnomalyReport | null>(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<GeneratedScript | null>(null);
  const [activeProviderName, setActiveProviderName] = useState('Offline Expert Engine');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial AI config & run initial anomaly scan
  useEffect(() => {
    fetchActiveProvider();
    runInitialScan();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  const fetchActiveProvider = async () => {
    try {
      const res = await fetch('/api/advisor');
      const data = await res.json();
      if (data.success && data.config) {
        const p = data.config.provider;
        if (p === 'gemini') setActiveProviderName('Google Gemini');
        else if (p === 'openai') setActiveProviderName('OpenAI GPT-4o');
        else if (p === 'groq') setActiveProviderName('Groq AI');
        else if (p === 'ollama') setActiveProviderName('Ollama (Lokal)');
        else setActiveProviderName('Offline Expert Engine (Free)');
      }
    } catch {
      // Ignore
    }
  };

  const runInitialScan = async () => {
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Diagnosa anomali dan kesehatan jaringan' }),
      });
      const data = await res.json();
      if (data.success && data.anomalyReport) {
        setAnomalyReport(data.anomalyReport);
      }
    } catch {
      // Ignore
    }
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const prompt = (promptToSend || inputPrompt).trim();
    if (!prompt || isQuerying) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsQuerying(true);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          text: data.answer,
          providerUsed: data.providerUsed,
          modelUsed: data.modelUsed,
          isFallback: data.isFallback,
          executionTimeMs: data.executionTimeMs,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          recommendedScripts: data.recommendedScripts || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (data.anomalyReport) {
          setAnomalyReport(data.anomalyReport);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: `⚠️ **Gagal memproses permintaan:** ${data.message || 'Terjadi kesalahan internal.'}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Koneksi Terputus:** Tidak dapat menghubungi backend advisor (${err.message}).`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const quickPrompts = [
    { label: '🚀 Optimasi Queue Tree PCQ', prompt: 'Buatkan rekomendasi dan script QoS Queue Tree PCQ untuk router MikroTik' },
    { label: '🛡️ Firewall Anti Brute-Force', prompt: 'Buatkan script firewall RAW dan filter untuk menangkal serangan brute-force Winbox/SSH' },
    { label: '🌐 Failover Dual-WAN PCC', prompt: 'Bagaimana cara setup Load Balancing Dual-WAN PCC dan failover otomatis?' },
    { label: '⚡ FastTrack & TCP MSS', prompt: 'Optimasi performa CPU router dengan FastTrack dan TCP MSS clamping' },
  ];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-m3-2xl bg-gradient-to-r from-m3-surface-container to-m3-surface-container-high border border-m3-outline-variant/30 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-m3-xl bg-gradient-to-tr from-m3-primary to-sky-400 text-white shadow-m3-1">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-m3-on-surface">NOC AI Advisor & Copilot</h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                AIOps v2.0
              </span>
            </div>
            <p className="text-xs text-m3-on-surface-variant font-medium">
              Analisis cerdas telemetri router, deteksi anomali log Loki, dan generator script MikroTik siap pakai.
            </p>
          </div>
        </div>

        {/* AI Provider Config Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProviderModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/40 hover:border-m3-primary text-xs font-bold text-m3-on-surface transition-all shadow-2xs"
          >
            <Cpu className="w-4 h-4 text-m3-primary" />
            <div className="text-left">
              <div className="text-[9px] text-m3-on-surface-variant uppercase font-mono">Provider AI</div>
              <div className="text-xs font-bold truncate max-w-[140px]">{activeProviderName}</div>
            </div>
            <Settings className="w-3.5 h-3.5 ml-1 text-m3-on-surface-variant" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Chat & Right Anomaly Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Chat Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <M3Card className="p-0 bg-m3-surface-container-lowest border border-m3-outline-variant/30 flex flex-col h-[650px] shadow-xs overflow-hidden">
            {/* Chat Top Header: Realtime Context Indicator */}
            <div className="px-4 py-3 bg-m3-surface-container/60 border-b border-m3-outline-variant/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3 text-m3-on-surface-variant">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Live Context
                </span>
                <span>WAN: ↓ {latestThroughput.inbound.toFixed(1)}M / ↑ {latestThroughput.outbound.toFixed(1)}M</span>
                <span>• Node: {liveStats.onlineCount} ON</span>
              </div>
              <button
                onClick={runInitialScan}
                title="Pindai Ulang Telemetri"
                className="p-1 rounded-m3-full text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container-high transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chat Scrollable Message Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-m3-primary to-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2`}>
                    {/* Bubble Content */}
                    <div
                      className={`p-4 rounded-m3-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-m3-primary text-m3-on-primary rounded-br-xs font-medium shadow-xs'
                          : 'bg-m3-surface-container border border-m3-outline-variant/30 text-m3-on-surface rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans markdown-body">
                        {msg.text}
                      </div>

                      {/* Attached RouterOS Scripts */}
                      {msg.recommendedScripts && msg.recommendedScripts.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-m3-outline-variant/30 space-y-2">
                          <div className="text-[11px] font-bold text-m3-primary flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5" />
                            Skrip RouterOS Siap Pakai ({msg.recommendedScripts.length})
                          </div>
                          {msg.recommendedScripts.map((s) => (
                            <div
                              key={s.id}
                              className="p-2.5 rounded-m3-xl bg-m3-surface-container-high border border-m3-outline-variant/30 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-m3-on-surface truncate">{s.title}</div>
                                <div className="text-[10px] text-m3-on-surface-variant truncate">{s.description}</div>
                              </div>
                              <M3Button
                                variant="filled"
                                size="sm"
                                onClick={() => setSelectedScript(s)}
                                className="shrink-0 text-xs"
                              >
                                Lihat & Salin Script
                              </M3Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Metadata & Timestamp */}
                    <div className="flex items-center gap-2 text-[10px] text-m3-on-surface-variant font-mono px-1">
                      <span>{msg.timestamp}</span>
                      {msg.modelUsed && (
                        <span className="px-1.5 py-0.2 rounded bg-m3-surface-container-high text-m3-on-surface-variant">
                          {msg.modelUsed}
                        </span>
                      )}
                      {msg.executionTimeMs && (
                        <span>{msg.executionTimeMs}ms</span>
                      )}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isQuerying && (
                <div className="flex gap-3 items-center text-xs text-m3-on-surface-variant italic">
                  <div className="w-8 h-8 rounded-full bg-m3-primary/20 text-m3-primary flex items-center justify-center shrink-0 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-m3-2xl bg-m3-surface-container border border-m3-outline-variant/30 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-m3-primary" />
                    <span>NOC AI sedang menganalisa telemetri & log jaringan...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips */}
            <div className="px-4 py-2 bg-m3-surface-container/30 border-t border-m3-outline-variant/20 flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={isQuerying}
                  className="px-2.5 py-1 rounded-full bg-m3-surface-container-high hover:bg-m3-primary/15 hover:text-m3-primary border border-m3-outline-variant/30 text-[11px] font-semibold text-m3-on-surface-variant whitespace-nowrap transition-all"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-m3-surface-container-low border-t border-m3-outline-variant/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Tanyakan analisis jaringan, diagnosa alert, atau minta script MikroTik..."
                  disabled={isQuerying}
                  className="flex-1 px-4 py-2.5 rounded-m3-full bg-m3-surface-container border border-m3-outline-variant/40 focus:border-m3-primary focus:outline-hidden text-xs text-m3-on-surface font-sans placeholder:text-m3-on-surface-variant/60"
                />
                <button
                  type="submit"
                  disabled={isQuerying || !inputPrompt.trim()}
                  className="p-2.5 rounded-full bg-m3-primary text-m3-on-primary hover:bg-m3-primary/90 disabled:opacity-50 transition-all shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </M3Card>
        </div>

        {/* Right Column: AIOps Anomaly Radar & System Health (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <AnomalyScoreRadar
            report={anomalyReport}
            onSelectAction={(prompt) => handleSendMessage(prompt)}
          />
        </div>
      </div>

      {/* Script Preview & Copy Modal */}
      <RouterOsScriptModal
        script={selectedScript}
        open={!!selectedScript}
        onClose={() => setSelectedScript(null)}
      />

      {/* AI Provider Settings & Login Modal */}
      <AiProviderModal
        open={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        onSaved={() => {
          fetchActiveProvider();
          runInitialScan();
        }}
      />
    </div>
  );
}
