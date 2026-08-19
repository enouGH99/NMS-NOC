'use client';

import React, { useState } from 'react';
import { useNms } from '@/lib/store';
import { User, UserRole } from '@/lib/types';
import { M3Card } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3Dialog } from '@/components/m3/M3Dialog';
import { M3TextField } from '@/components/m3/M3TextField';
import { Users, Plus, ShieldCheck, ShieldAlert, Phone, Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const { users, currentUser, addUser, toggleUserStatus } = useNms();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('petugas');

  const handleAddUser = () => {
    if (!name || !email) return;
    addUser({
      name,
      email,
      phone: phone || '+62 812-0000-0000',
      role,
      status: 'active',
    });
    setName('');
    setEmail('');
    setPhone('');
    setAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-m3-primary" />
            Manajemen Pengguna & Hak Akses
          </h1>
          <p className="text-xs md:text-sm text-m3-on-surface-variant">
            Pengaturan akun staf NOC, penugasan hak akses peran (Admin vs Petugas), dan status keanggotaan
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <M3Button
            variant="filled"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Tambah Pengguna Baru
          </M3Button>
        )}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isAdmin = u.role === 'admin';
          const isActive = u.status === 'active';

          return (
            <M3Card
              key={u.id}
              className="p-5 bg-m3-surface-container border border-m3-outline-variant/30 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-m3-primary/15 text-m3-primary font-bold text-lg flex items-center justify-center">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-m3-on-surface">{u.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                        isAdmin
                          ? 'bg-m3-primary text-m3-on-primary'
                          : 'bg-m3-secondary-container text-m3-on-secondary-container'
                      }`}
                    >
                      {isAdmin ? (
                        <ShieldCheck className="w-3 h-3 inline" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 inline" />
                      )}
                      {u.role}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {isActive ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-m3-on-surface-variant pt-2 border-t border-m3-outline-variant/30">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-m3-primary" />
                  <span>{u.email}</span>
                </div>
                {u.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-m3-primary" />
                    <span>{u.phone}</span>
                  </div>
                )}
                <div className="text-[11px] text-m3-on-surface-variant/80 pt-1">
                  Login Terakhir: {u.last_login.includes('T') ? formatDate(u.last_login) : u.last_login}
                </div>
              </div>

              {currentUser.role === 'admin' && (
                <div className="pt-2 border-t border-m3-outline-variant/30 flex items-center justify-end gap-2">
                  <M3Button
                    size="sm"
                    variant="text"
                    onClick={() => toggleUserStatus(u.id)}
                  >
                    {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </M3Button>
                </div>
              )}
            </M3Card>
          );
        })}
      </div>

      {/* Add User Dialog */}
      <M3Dialog
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Pengguna NMS Baru"
        icon={<Plus className="w-5 h-5 text-m3-primary" />}
        confirmLabel="Simpan Pengguna"
        onConfirm={handleAddUser}
      >
        <div className="space-y-4 pt-1">
          <M3TextField
            label="Nama Lengkap"
            placeholder="contoh: Ahmad Fauzi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <M3TextField
            label="Alamat Email"
            placeholder="fauzi@kantor.go.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <M3TextField
            label="Nomor Telepon / WhatsApp"
            placeholder="+62 812-3344-5566"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div>
            <label className="text-xs font-medium text-m3-on-surface-variant px-1 block mb-1.5">
              Peran / Wewenang (Role)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full h-12 rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-lowest px-3 text-sm text-m3-on-surface focus:ring-2 focus:ring-m3-primary outline-none"
            >
              <option value="petugas">Petugas Lapangan (Monitoring, Ping & Catat Perbaikan)</option>
              <option value="admin">Administrator (Full Access & Kelola Pengguna)</option>
            </select>
          </div>
        </div>
      </M3Dialog>
    </div>
  );
}
