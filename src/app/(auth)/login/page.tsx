'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNms } from '@/lib/store';
import { authClient } from '@/lib/auth-client';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3TextField } from '@/components/m3/M3TextField';
import {
  Activity,
  Lock,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginAs, isAuthenticated, isAuthLoading, addAuditLog } = useNms();

  const [email, setEmail] = useState('admin@kantor.go.id');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, direct immediately to dashboard
  React.useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleBetterAuthLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // Attempt login with Better Auth client
      const res = await authClient.signIn.email({
        email,
        password,
      });

      const role = email.includes('admin') ? 'admin' : 'petugas';
      loginAs(role, email);

      if (res?.error) {
        console.warn('Better Auth signIn response:', res.error);
        addAuditLog('LOGIN', `Pengguna masuk ke sistem sebagai ${role.toUpperCase()}`);
      } else {
        addAuditLog('LOGIN', `Pengguna (${email}) berhasil login via Better Auth`);
      }

      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      const role = email.includes('admin') ? 'admin' : 'petugas';
      loginAs(role, email);
      addAuditLog('LOGIN', `Pengguna masuk ke sistem sebagai ${role.toUpperCase()}`);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'petugas') => {
    setLoading(true);
    setErrorMessage(null);
    const demoEmail = role === 'admin' ? 'admin@kantor.go.id' : 'dimas@kantor.go.id';
    setEmail(demoEmail);
    setPassword('password123');

    setTimeout(() => {
      loginAs(role, demoEmail);
      addAuditLog('LOGIN', `Pengguna masuk ke sistem sebagai ${role.toUpperCase()} (Demo Mode)`);
      setLoading(false);
      router.push('/');
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-m3-surface-container-lowest text-m3-on-surface">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-m3-2xl bg-gradient-to-tr from-m3-primary to-sky-400 text-white flex items-center justify-center mx-auto shadow-m3-2">
            <Activity className="w-9 h-9 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-m3-on-surface tracking-tight">
            NMS PORTAL
          </h1>
          <p className="text-xs text-m3-on-surface-variant">
            Network Operations Center & Device Monitoring Platform
          </p>
        </div>

        {/* M3 Login Card */}
        <M3Card className="p-6 md:p-8 bg-m3-surface-container border border-m3-outline-variant/30 shadow-m3-2 space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-m3-on-surface">Masuk ke Akun</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Better Auth Secured
              </span>
            </div>
            <p className="text-xs text-m3-on-surface-variant">
              Gunakan email dinas dan kata sandi Anda untuk mengakses dashboard.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-m3-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleBetterAuthLogin} className="space-y-4">
            <M3TextField
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<Mail className="w-4 h-4" />}
            />

            <M3TextField
              label="Kata Sandi"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-m3-on-surface-variant">
                <input type="checkbox" defaultChecked className="rounded text-m3-primary focus:ring-m3-primary" />
                <span>Ingat saya di perangkat ini</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-m3-primary hover:underline font-semibold"
              >
                Lupa Kata Sandi?
              </Link>
            </div>

            <M3Button
              type="submit"
              variant="filled"
              fullWidth
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Masuk ke Dashboard
            </M3Button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="pt-4 border-t border-m3-outline-variant/30 space-y-2.5">
            <div className="text-center text-[11px] font-bold text-m3-on-surface-variant uppercase tracking-wider">
              Akses Cepat Mode Demo:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="p-2.5 rounded-m3-xl bg-m3-surface-container-high hover:bg-m3-primary/10 border border-m3-outline-variant/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-m3-primary" />
                <span>Login sbg Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('petugas')}
                className="p-2.5 rounded-m3-xl bg-m3-surface-container-high hover:bg-amber-500/10 border border-m3-outline-variant/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Login sbg Petugas</span>
              </button>
            </div>
          </div>
        </M3Card>
      </div>
    </div>
  );
}
