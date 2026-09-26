'use client';

import React, { useState } from 'react';
import { M3Dialog } from '@/components/m3/M3Dialog';
import { M3Button } from '@/components/m3/M3Button';
import { M3Badge } from '@/components/m3/M3Badge';
import { GeneratedScript } from '@/lib/routeros-generator';
import { Copy, Check, Terminal, ShieldAlert, ShieldCheck, Info } from 'lucide-react';

interface RouterOsScriptModalProps {
  script: GeneratedScript | null;
  open: boolean;
  onClose: () => void;
}

export const RouterOsScriptModal: React.FC<RouterOsScriptModalProps> = ({ script, open, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!script) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(script.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getSafetyBadge = (level: string) => {
    switch (level) {
      case 'safe':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tingkat Risiko: Aman (Safe)
          </span>
        );
      case 'medium_risk':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
            <Info className="w-3.5 h-3.5" />
            Tingkat Risiko: Sedang (Medium Risk)
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Tingkat Risiko: Kritis (High Risk)
          </span>
        );
    }
  };

  return (
    <M3Dialog
      isOpen={open}
      onClose={onClose}
      title={script.title}
      maxWidth="lg"
    >
      <div className="space-y-4 py-2">
        {/* Header Info & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-m3-xl bg-m3-surface-container border border-m3-outline-variant/30">
          <div className="flex items-center gap-2">
            {getSafetyBadge(script.safetyLevel)}
            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-m3-primary/15 text-m3-primary">
              Kategori: {script.category}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {script.tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-m3-surface-container-high border border-m3-outline-variant/30 text-m3-on-surface-variant font-mono">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Description & Technical Points */}
        <div className="space-y-2 text-xs text-m3-on-surface">
          <p className="font-medium text-m3-on-surface-variant">{script.description}</p>
          <div className="p-3 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/20 space-y-1.5">
            <div className="font-bold text-m3-on-surface text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-m3-primary" />
              Catatan Teknis & Cara Kerja:
            </div>
            <ul className="list-disc list-inside space-y-1 text-m3-on-surface-variant text-[11px]">
              {script.explanation.map((exp, idx) => (
                <li key={idx}>{exp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Code Snippet Box with Copy Button */}
        <div className="relative rounded-m3-xl overflow-hidden border border-m3-outline-variant/40 bg-zinc-950 font-mono text-xs">
          <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>MikroTik RouterOS CLI Script</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors font-sans text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Script</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 text-emerald-400/90 overflow-x-auto max-h-72 leading-relaxed text-[11px]">
            <code>{script.script}</code>
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-m3-outline-variant/30">
          <span className="text-[10px] text-m3-on-surface-variant">
            💡 Tempelkan script di atas ke <strong>WinBox &gt; New Terminal</strong> atau via SSH RouterOS.
          </span>
          <div className="flex items-center gap-2">
            <M3Button variant="text" onClick={onClose}>
              Tutup
            </M3Button>
            <M3Button variant="filled" onClick={handleCopy}>
              {copied ? 'Berhasil Disalin' : 'Salin ke Clipboard'}
            </M3Button>
          </div>
        </div>
      </div>
    </M3Dialog>
  );
};
