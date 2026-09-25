'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LokiLogEntry, LogLevel } from '@/lib/types';
import {
  Terminal,
  Search,
  Play,
  Pause,
  Download,
  Copy,
  Trash2,
  ArrowDown,
  Filter,
  Shield,
  Radio,
  Server,
  KeyRound,
  Check,
  RotateCcw,
} from 'lucide-react';

interface LokiLogStreamViewerProps {
  initialLogs?: LokiLogEntry[];
}

export const LokiLogStreamViewer: React.FC<LokiLogStreamViewerProps> = ({ initialLogs = [] }) => {
  const [logs, setLogs] = useState<LokiLogEntry[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch logs from API
  const fetchLogs = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const params = new URLSearchParams();
      params.set('limit', '120');
      if (selectedTopic !== 'all') params.set('topic', selectedTopic);
      if (selectedLevel !== 'all') params.set('level', selectedLevel);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/observability/loki?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.warn('Gagal fetch logs dari Loki API:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Initial load and filter change
  useEffect(() => {
    fetchLogs();
  }, [selectedTopic, selectedLevel]);

  // Live polling stream timer (every 4 seconds when streaming is active)
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [isStreaming, selectedTopic, selectedLevel, searchQuery]);

  // Auto-scroll handler
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.host}] [${l.topic || 'sys'}]: ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = 'Timestamp,Level,Host,Topic,Message\n';
    const rows = logs.map(l => `"${l.timestamp}","${l.level}","${l.host || ''}","${l.topic || ''}","${l.message.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `loki-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'crit':
      case 'alert':
      case 'emerg':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">CRIT</span>;
      case 'error':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/40">ERROR</span>;
      case 'warn':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">WARN</span>;
      case 'notice':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">NOTICE</span>;
      case 'debug':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-500/20 text-slate-400 border border-slate-500/40">DEBUG</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">INFO</span>;
    }
  };

  const topicChips = [
    { id: 'all', label: 'Semua Log', icon: Terminal },
    { id: 'firewall', label: 'MikroTik Firewall', icon: Shield },
    { id: 'dhcp', label: 'DHCP Leases', icon: Radio },
    { id: 'vpn', label: 'VPN / Tunnels', icon: KeyRound },
    { id: 'dns', label: 'DNS Zeus (BIND9)', icon: Server },
    { id: 'system', label: 'System & Auth', icon: Terminal },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Top Filter Bar & Topic Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-m3-surface-container p-3 rounded-m3-xl border border-m3-outline-variant/30">
        <div className="flex flex-wrap items-center gap-1.5">
          {topicChips.map((chip) => {
            const Icon = chip.icon;
            const isActive = selectedTopic === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedTopic(chip.id)}
                className={`px-3 py-1.5 rounded-m3-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                    : 'bg-m3-surface-container-high text-m3-on-surface hover:bg-m3-primary/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Severity Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-1.5 rounded-m3-lg bg-m3-surface-container-high border border-m3-outline-variant/30 text-xs font-bold text-m3-on-surface focus:outline-none focus:ring-1 focus:ring-m3-primary"
          >
            <option value="all">Semua Level</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
            <option value="crit">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Search Input and Control Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-m3-surface-container p-2.5 rounded-m3-xl border border-m3-outline-variant/30">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari IP, kata kunci, atau query LogQL (e.g. {job=&quot;mikrotik&quot;} |= &quot;firewall&quot;)..."
            className="w-full pl-9 pr-20 py-2 rounded-m3-lg bg-m3-surface text-xs text-m3-on-surface border border-m3-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-m3-primary/50 font-mono"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-m3-md bg-m3-primary text-m3-on-primary text-[11px] font-bold"
          >
            Cari
          </button>
        </form>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* Play / Pause Live Stream */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded-m3-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              isStreaming
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
            title={isStreaming ? 'Jeda streaming log' : 'Lanjutkan streaming log'}
          >
            {isStreaming ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Stream</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Paused</span>
              </>
            )}
          </button>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-2 rounded-m3-lg text-xs transition-colors ${
              autoScroll
                ? 'bg-m3-primary/20 text-m3-primary border border-m3-primary/40'
                : 'bg-m3-surface-container-high text-m3-on-surface-variant'
            }`}
            title={autoScroll ? 'Auto-scroll Aktif' : 'Auto-scroll Mati'}
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyLogs}
            className="p-2 rounded-m3-lg bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors"
            title="Salin seluruh log ke clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-2 rounded-m3-lg bg-m3-surface-container-high text-m3-on-surface-variant hover:text-m3-on-surface transition-colors"
            title="Download log sebagai CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear Logs */}
          <button
            onClick={handleClearLogs}
            className="p-2 rounded-m3-lg bg-m3-surface-container-high text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Bersihkan layar konsol"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Log Console Window */}
      <div className="relative rounded-m3-xl bg-[#070b14] border border-[#1e293b] overflow-hidden shadow-xl font-mono text-[11.5px] leading-relaxed select-text">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0d1424] border-b border-[#1e293b] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="font-semibold text-slate-300 ml-2">Loki Stream Console</span>
            <span className="text-[10px] text-slate-500">({logs.length} entri log)</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Server: <strong className="text-slate-200">192.168.100.226:3100</strong></span>
            {loading && <RotateCcw className="w-3.5 h-3.5 animate-spin text-sky-400" />}
          </div>
        </div>

        {/* Scrollable Terminal Log Lines */}
        <div className="p-3.5 h-[520px] overflow-y-auto space-y-1.5 text-slate-300 scrollbar-thin scrollbar-thumb-slate-700">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <p className="text-xs">Tidak ada log yang sesuai dengan filter atau query saat ini.</p>
            </div>
          ) : (
            logs.map((log, index) => {
              const dateStr = new Date(log.timestampMs).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              });

              return (
                <div
                  key={log.id || `log-${index}`}
                  className="group flex flex-col md:flex-row md:items-start gap-1.5 md:gap-2.5 p-1.5 rounded hover:bg-white/[0.04] transition-colors"
                >
                  {/* Timestamp & Level */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 text-[10.5px]">{dateStr}</span>
                    {getLevelBadge(log.level)}
                  </div>

                  {/* Host / Source Pill */}
                  <div className="shrink-0 flex items-center gap-1 text-[10.5px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                      {log.host || '192.168.3.1'}
                    </span>
                    {log.topic && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 text-[10px] uppercase font-bold">
                        {log.topic}
                      </span>
                    )}
                  </div>

                  {/* Message Body with colored keywords */}
                  <div className="flex-1 break-all text-slate-200">
                    {formatLogMessage(log.message)}
                  </div>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};

/**
 * Format message highlighting IP addresses and keywords
 */
function formatLogMessage(msg: string) {
  // Regex to highlight IP addresses in cyan
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
  const parts = msg.split(ipRegex);
  const matches = msg.match(ipRegex) || [];

  return (
    <span>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span>{part}</span>
          {matches[i] && (
            <span className="text-cyan-300 font-bold underline decoration-cyan-500/30">
              {matches[i]}
            </span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}
