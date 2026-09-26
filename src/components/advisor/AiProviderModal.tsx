'use client';

import React, { useState, useEffect } from 'react';
import { M3Dialog } from '@/components/m3/M3Dialog';
import { M3Button } from '@/components/m3/M3Button';
import { M3TextField } from '@/components/m3/M3TextField';
import { Sparkles, Key, CheckCircle, AlertTriangle, RefreshCw, Cpu, Globe, Server } from 'lucide-react';

interface AiProviderModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const AiProviderModal: React.FC<AiProviderModalProps> = ({ open, onClose, onSaved }) => {
  const [provider, setProvider] = useState<'builtin' | 'gemini' | 'openai' | 'groq' | 'ollama'>('builtin');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [maskedKey, setMaskedKey] = useState('');

  useEffect(() => {
    if (open) {
      fetchCurrentConfig();
    }
  }, [open]);

  const fetchCurrentConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/advisor');
      const data = await res.json();
      if (data.success && data.config) {
        setProvider(data.config.provider || 'builtin');
        setMaskedKey(data.config.maskedApiKey || '');
        setModelName(data.config.modelName || '');
        setBaseUrl(data.config.baseUrl || '');
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/advisor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || undefined,
          modelName: modelName || undefined,
          baseUrl: baseUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.message || 'Koneksi gagal.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/advisor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || undefined,
          modelName: modelName || undefined,
          baseUrl: baseUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (onSaved) onSaved();
        onClose();
      } else {
        setTestResult({ success: false, message: data.message || 'Gagal menyimpan konfigurasi.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <M3Dialog
      isOpen={open}
      onClose={onClose}
      title="Manajemen Akun & Provider AI NOC"
      maxWidth="md"
    >
      <div className="space-y-4 py-2">
        {/* Provider Cards Selector */}
        <div>
          <label className="text-xs font-bold text-m3-on-surface-variant mb-2 block">
            Pilih Model / Layanan AI:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Built-in Offline Expert */}
            <div
              onClick={() => {
                setProvider('builtin');
                setModelName('NOC-Expert-Heuristic-v2');
                setTestResult(null);
              }}
              className={`p-3 rounded-m3-xl border cursor-pointer transition-all ${
                provider === 'builtin'
                  ? 'border-m3-primary bg-m3-primary/10 shadow-xs'
                  : 'border-m3-outline-variant/30 hover:border-m3-outline-variant bg-m3-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-m3-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-m3-on-surface flex items-center gap-1">
                    Offline Expert Engine
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      FREE / OFFLINE
                    </span>
                  </div>
                  <div className="text-[10px] text-m3-on-surface-variant truncate">
                    Bawaan NMS (Tanpa API Key, Heuristic MikroTik)
                  </div>
                </div>
              </div>
            </div>

            {/* Google Gemini */}
            <div
              onClick={() => {
                setProvider('gemini');
                if (!modelName || modelName.includes('NOC-')) setModelName('gemini-1.5-flash');
                setTestResult(null);
              }}
              className={`p-3 rounded-m3-xl border cursor-pointer transition-all ${
                provider === 'gemini'
                  ? 'border-m3-primary bg-m3-primary/10 shadow-xs'
                  : 'border-m3-outline-variant/30 hover:border-m3-outline-variant bg-m3-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-m3-lg bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-m3-on-surface flex items-center gap-1">
                    Google Gemini
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-extrabold">
                      1.5 Pro / Flash
                    </span>
                  </div>
                  <div className="text-[10px] text-m3-on-surface-variant truncate">
                    Analisis multimodal & log berkecepatan tinggi
                  </div>
                </div>
              </div>
            </div>

            {/* OpenAI / Groq */}
            <div
              onClick={() => {
                setProvider('openai');
                if (!modelName || modelName.includes('NOC-') || modelName.includes('gemini')) setModelName('gpt-4o-mini');
                setTestResult(null);
              }}
              className={`p-3 rounded-m3-xl border cursor-pointer transition-all ${
                provider === 'openai'
                  ? 'border-m3-primary bg-m3-primary/10 shadow-xs'
                  : 'border-m3-outline-variant/30 hover:border-m3-outline-variant bg-m3-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-m3-lg bg-emerald-600/20 text-emerald-600">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-m3-on-surface">OpenAI GPT-4o / Mini</div>
                  <div className="text-[10px] text-m3-on-surface-variant truncate">
                    Deep reasoning & code generation MTCNA
                  </div>
                </div>
              </div>
            </div>

            {/* Ollama / Self-Hosted */}
            <div
              onClick={() => {
                setProvider('ollama');
                setModelName('llama3');
                setBaseUrl('http://192.168.100.14:11434');
                setTestResult(null);
              }}
              className={`p-3 rounded-m3-xl border cursor-pointer transition-all ${
                provider === 'ollama'
                  ? 'border-m3-primary bg-m3-primary/10 shadow-xs'
                  : 'border-m3-outline-variant/30 hover:border-m3-outline-variant bg-m3-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-m3-lg bg-amber-500/20 text-amber-600">
                  <Server className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-m3-on-surface">Ollama (Private Server)</div>
                  <div className="text-[10px] text-m3-on-surface-variant truncate">
                    Server AI lokal kantor tanpa cloud
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Credentials Form */}
        {provider !== 'builtin' && (
          <div className="p-3.5 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30 space-y-3">
            {provider !== 'ollama' && (
              <div>
                <M3TextField
                  label={`API Key ${provider.toUpperCase()}`}
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={maskedKey ? `Tersimpan: ${maskedKey}` : 'Masukkan API Key Anda...'}
                  helperText="Kredensial disimpan secara terenkripsi dan tidak dibagikan."
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <M3TextField
                label="Nama Model (Model ID)"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder={
                  provider === 'gemini'
                    ? 'gemini-1.5-flash'
                    : provider === 'openai'
                    ? 'gpt-4o-mini'
                    : 'llama3'
                }
              />

              {(provider === 'ollama' || provider === 'groq') && (
                <M3TextField
                  label="Server Base URL"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={
                    provider === 'ollama' ? 'http://192.168.100.14:11434' : 'https://api.groq.com/openai/v1'
                  }
                />
              )}
            </div>
          </div>
        )}

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-m3-lg text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-m3-outline-variant/30">
          <div>
            {provider !== 'builtin' && (
              <M3Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={isTesting || isLoading}
                className="text-xs"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Key className="w-3.5 h-3.5 mr-1.5" />
                )}
                Uji Sambungan (Ping AI)
              </M3Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <M3Button variant="text" onClick={onClose} disabled={isLoading}>
              Batal
            </M3Button>
            <M3Button variant="filled" onClick={handleSave} disabled={isLoading || isTesting}>
              {isLoading ? 'Menyimpan...' : 'Simpan & Aktifkan'}
            </M3Button>
          </div>
        </div>
      </div>
    </M3Dialog>
  );
};
