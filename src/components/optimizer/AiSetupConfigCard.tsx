'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { M3Card } from '../m3/M3Card';
import { M3Button } from '../m3/M3Button';
import { M3Switch } from '../m3/M3Switch';
import {
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Sliders,
  Bell,
  ShieldCheck,
  Globe,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { AiProvider } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export const AiSetupConfigCard: React.FC = () => {
  const { aiConfig, updateAiConfig, testAiConnection } = useNms();

  const [provider, setProvider] = useState<AiProvider>(aiConfig.provider);
  const [model, setModel] = useState<string>(aiConfig.model);
  const [apiKey, setApiKey] = useState<string>(aiConfig.api_key);
  const [customEndpoint, setCustomEndpoint] = useState<string>(aiConfig.custom_endpoint || '');
  const [temperature, setTemperature] = useState<number>(aiConfig.temperature);
  const [maxTokens, setMaxTokens] = useState<number>(aiConfig.max_tokens);
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(aiConfig.auto_scan_enabled);
  const [autoScanInterval, setAutoScanInterval] = useState<number>(aiConfig.auto_scan_interval_minutes);
  const [autoGenerateScripts, setAutoGenerateScripts] = useState<boolean>(aiConfig.auto_generate_scripts);
  const [notifyOnAnomaly, setNotifyOnAnomaly] = useState<boolean>(aiConfig.notify_on_anomaly);

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const providerModels: Record<AiProvider, { label: string; models: string[]; docsUrl: string }> = {
    google_gemini: {
      label: 'Google Gemini AI',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'],
      docsUrl: 'https://aistudio.google.com/app/apikey',
    },
    openai: {
      label: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
      docsUrl: 'https://platform.openai.com/api-keys',
    },
    anthropic_claude: {
      label: 'Anthropic Claude',
      models: ['claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest'],
      docsUrl: 'https://console.anthropic.com/settings/keys',
    },
    local_ollama: {
      label: 'Local LLM / Ollama (On-Premise NOC)',
      models: ['deepseek-r1:14b', 'llama3.3:70b', 'mistral-nemo:12b', 'qwen2.5-coder:14b'],
      docsUrl: 'http://localhost:11434',
    },
  };

  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    setModel(providerModels[newProvider].models[0]);
    if (newProvider === 'local_ollama' && !customEndpoint) {
      setCustomEndpoint('http://192.168.1.100:11434/v1');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testAiConnection();
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    updateAiConfig({
      provider,
      model,
      api_key: apiKey,
      custom_endpoint: customEndpoint,
      temperature,
      max_tokens: maxTokens,
      auto_scan_enabled: autoScanEnabled,
      auto_scan_interval_minutes: autoScanInterval,
      auto_generate_scripts: autoGenerateScripts,
      notify_on_anomaly: notifyOnAnomaly,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <M3Card className="p-5 sm:p-7 bg-m3-surface-container border border-m3-outline-variant/30 space-y-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-m3-outline-variant/30">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-m3-2xl bg-gradient-to-tr from-m3-primary to-sky-400 text-white shadow-m3-1 shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-m3-on-surface tracking-tight">
                Pengaturan API Key & Mesin AI Network Optimizer
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-m3-primary/15 text-m3-primary font-bold border border-m3-primary/30">
                Setup Mandiri
              </span>
            </div>
            <p className="text-xs text-m3-on-surface-variant mt-0.5">
              Konfigurasikan kredensial provider LLM (Google Gemini, OpenAI, Claude, atau Local Ollama On-Premise)
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              aiConfig.connection_status === 'connected'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
            }`}
          >
            {aiConfig.connection_status === 'connected' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terhubung ({aiConfig.response_time_ms || 215}ms)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Belum Terhubung</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Provider & Model Selection */}
        <div className="space-y-4 p-4 sm:p-5 rounded-m3-2xl bg-m3-surface-container-high/60 border border-m3-outline-variant/30">
          <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-m3-primary" />
            <span>1. Provider & Model AI</span>
          </div>

          {/* Provider Radio Pills */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(providerModels) as AiProvider[]).map((pKey) => {
              const isSelected = provider === pKey;
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => handleProviderChange(pKey)}
                  className={`p-3 rounded-m3-xl border text-left transition-all flex flex-col justify-between space-y-1 ${
                    isSelected
                      ? 'bg-m3-secondary-container border-m3-primary text-m3-on-secondary-container shadow-2xs font-bold'
                      : 'bg-m3-surface-container border-m3-outline-variant/30 text-m3-on-surface-variant hover:bg-m3-surface-container-high'
                  }`}
                >
                  <span className="text-xs font-bold">{providerModels[pKey].label}</span>
                  <span className="text-[10px] opacity-75">
                    {pKey === 'local_ollama' ? 'On-Premise LAN' : 'Cloud LLM API'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Model Selection Dropdown */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-m3-on-surface">
              Pilih Model Kecerdasan Buatan
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:ring-2 focus:ring-m3-primary"
            >
              {providerModels[provider].models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Docs / Get Key Link */}
          <div className="text-[11px] text-m3-on-surface-variant flex items-center justify-between pt-1">
            <span>Dapatkan kredensial resmi:</span>
            <a
              href={providerModels[provider].docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-m3-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Buka Console {providerModels[provider].label}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 2. API Key & Endpoint Security */}
        <div className="space-y-4 p-4 sm:p-5 rounded-m3-2xl bg-m3-surface-container-high/60 border border-m3-outline-variant/30">
          <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface uppercase tracking-wider">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>2. Kredensial & Autentikasi API</span>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-m3-on-surface">
                API Key {providerModels[provider].label}
              </label>
              <span className="text-[10px] text-m3-on-surface-variant font-mono">Terenkripsi Lokal</span>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'local_ollama' ? 'Opsional untuk Ollama' : 'Masukkan API Key resmi (cth: AIzaSy... / sk-...) '}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:ring-2 focus:ring-m3-primary"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant hover:text-m3-on-surface"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Custom Endpoint URL (for Local Ollama or Proxies) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-m3-on-surface">
              Custom Endpoint URL (Opsional / On-Premise)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" />
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder={provider === 'local_ollama' ? 'http://192.168.1.100:11434/v1' : 'https://api.gateway.internal/v1'}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface focus:outline-hidden focus:ring-2 focus:ring-m3-primary"
              />
            </div>
            <span className="text-[10px] text-m3-on-surface-variant block">
              Gunakan jika server NMS berada dalam jaringan tertutup (Air-gapped) dengan Ollama internal.
            </span>
          </div>
        </div>
      </div>

      {/* 3. AI Hyperparameters & Autonomous Automation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
        {/* Hyperparameters Slider */}
        <div className="p-4 sm:p-5 rounded-m3-2xl bg-m3-surface-container-high/60 border border-m3-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>3. Parameter Inferensi AI</span>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-m3-on-surface">
                Temperature AI (Determinisme): <span className="font-mono text-m3-primary font-bold">{temperature}</span>
              </label>
              <span className="text-[10px] text-m3-on-surface-variant">
                {temperature <= 0.3 ? 'Sangat Presisi (Direkomendasikan)' : 'Kreatif'}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-m3-primary h-2 bg-m3-surface-container-highest rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-m3-on-surface-variant leading-tight">
              Nilai rendah (0.1 - 0.3) memastikan skrip RouterOS dan aturan firewall selalu konsisten dan bebas halusinasi.
            </p>
          </div>

          {/* Max Output Tokens */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-m3-on-surface">
              <span>Batas Token Output Maksimal</span>
              <span className="font-mono text-m3-primary">{maxTokens} tokens</span>
            </div>
            <select
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-m3-xl bg-m3-surface-container-lowest border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface"
            >
              <option value={2048}>2.048 Tokens (Cepat)</option>
              <option value={4096}>4.096 Tokens (Standar)</option>
              <option value={8192}>8.192 Tokens (Lengkap)</option>
            </select>
          </div>
        </div>

        {/* Automation & Background Scanners */}
        <div className="p-4 sm:p-5 rounded-m3-2xl bg-m3-surface-container-high/60 border border-m3-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-m3-on-surface uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-sky-500" />
            <span>4. Otomasi & Notifikasi AI</span>
          </div>

          <div className="space-y-3">
            {/* Auto Scan Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20">
              <div>
                <span className="text-xs font-bold text-m3-on-surface block">
                  Pindai Log Otomatis Berkala
                </span>
                <span className="text-[10px] text-m3-on-surface-variant">
                  Inspeksi log sistem MikroTik & SNMP otomatis
                </span>
              </div>
              <M3Switch
                checked={autoScanEnabled}
                onChange={() => setAutoScanEnabled(!autoScanEnabled)}
              />
            </div>

            {/* Interval */}
            {autoScanEnabled && (
              <div className="flex items-center justify-between pl-3 pr-2 text-xs">
                <span className="text-m3-on-surface-variant font-medium">Interval Pemindaian:</span>
                <select
                  value={autoScanInterval}
                  onChange={(e) => setAutoScanInterval(parseInt(e.target.value))}
                  className="px-2.5 py-1 rounded-m3-lg bg-m3-surface-container-lowest border border-m3-outline-variant/40 text-xs font-mono text-m3-on-surface"
                >
                  <option value={5}>Setiap 5 Menit</option>
                  <option value={15}>Setiap 15 Menit</option>
                  <option value={30}>Setiap 30 Menit</option>
                  <option value={60}>Setiap 1 Jam</option>
                </select>
              </div>
            )}

            {/* Auto Generate Script */}
            <div className="flex items-center justify-between p-2.5 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20">
              <div>
                <span className="text-xs font-bold text-m3-on-surface block">
                  Generate Skrip Perbaikan Otomatis
                </span>
                <span className="text-[10px] text-m3-on-surface-variant">
                  Buat solusi RouterOS CLI saat anomali terdeteksi
                </span>
              </div>
              <M3Switch
                checked={autoGenerateScripts}
                onChange={() => setAutoGenerateScripts(!autoGenerateScripts)}
              />
            </div>

            {/* Notification on Anomaly */}
            <div className="flex items-center justify-between p-2.5 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/20">
              <div>
                <span className="text-xs font-bold text-m3-on-surface block">
                  Peringatan Anomali Kritis
                </span>
                <span className="text-[10px] text-m3-on-surface-variant">
                  Kirim notifikasi lonceng & sound saat bottleneck kritis
                </span>
              </div>
              <M3Switch
                checked={notifyOnAnomaly}
                onChange={() => setNotifyOnAnomaly(!notifyOnAnomaly)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Test Connection Banner (if tested) */}
      {testResult && (
        <div
          className={`p-3.5 rounded-m3-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className="font-semibold">{testResult.message}</span>
          </div>
          {testResult.success && (
            <span className="font-mono font-bold text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full">
              Ping: {testResult.latency} ms
            </span>
          )}
        </div>
      )}

      {/* Saved Success Toast */}
      {savedSuccess && (
        <div className="p-3 rounded-m3-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Pengaturan AI Engine & API Key berhasil disimpan secara persisten!</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-m3-outline-variant/30">
        <span className="text-[11px] text-m3-on-surface-variant font-mono">
          Terakhir diuji: {aiConfig.last_tested_at ? formatDate(aiConfig.last_tested_at) : 'Belum pernah diuji'}
        </span>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <M3Button
            variant="outlined"
            loading={testing}
            onClick={handleTestConnection}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            {testing ? 'Menguji Handshake...' : 'Uji Koneksi API Key'}
          </M3Button>

          <M3Button
            variant="filled"
            onClick={handleSave}
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            Simpan Konfigurasi AI
          </M3Button>
        </div>
      </div>
    </M3Card>
  );
};
