'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3TextField } from '@/components/m3/M3TextField';
import { Activity, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-m3-surface-container-lowest text-m3-on-surface">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-m3-2xl bg-m3-primary text-m3-on-primary flex items-center justify-center mx-auto shadow-m3-2">
            <Activity className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-m3-on-surface tracking-tight">
            Pemulihan Akses
          </h1>
          <p className="text-xs text-m3-on-surface-variant">
            Reset kata sandi akun petugas NMS
          </p>
        </div>

        <M3Card className="p-6 md:p-8 bg-m3-surface-container border border-m3-outline-variant/30 shadow-m3-2 space-y-5">
          {submitted ? (
            <div className="text-center space-y-3 py-4 animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-m3-on-surface">Tautan Terkirim!</h3>
              <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                Instruksi pemulihan kata sandi telah dikirimkan ke <strong>{email}</strong>. Silakan periksa kotak masuk email Anda.
              </p>
              <div className="pt-3">
                <Link href="/login">
                  <M3Button variant="filled" fullWidth>
                    Kembali ke Halaman Login
                  </M3Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-m3-on-surface">Lupa Kata Sandi</h2>
                <p className="text-xs text-m3-on-surface-variant">
                  Masukkan email terdaftar Anda untuk menerima tautan pembuatan kata sandi baru.
                </p>
              </div>

              <M3TextField
                label="Alamat Email Terdaftar"
                type="email"
                required
                placeholder="nama@kantor.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leadingIcon={<Mail className="w-4 h-4" />}
              />

              <M3Button type="submit" variant="filled" fullWidth>
                Kirim Tautan Reset
              </M3Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-m3-primary hover:underline font-semibold inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke Halaman Login
                </Link>
              </div>
            </form>
          )}
        </M3Card>
      </div>
    </div>
  );
}
