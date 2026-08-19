'use client';

import React, { useState } from 'react';
import { RepairRecord } from '@/lib/types';
import { RepairTable } from '@/components/repairs/RepairTable';
import { AddRepairModal } from '@/components/repairs/AddRepairModal';
import { Wrench } from 'lucide-react';

export default function RepairsPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<RepairRecord | null>(null);

  const handleOpenAdd = () => {
    setRecordToEdit(null);
    setAddModalOpen(true);
  };

  const handleOpenEdit = (rec: RepairRecord) => {
    setRecordToEdit(rec);
    setAddModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-m3-on-surface tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-m3-primary" />
            Riwayat & Tiket Perbaikan Jaringan
          </h1>
          <p className="text-xs md:text-sm text-m3-on-surface-variant">
            Dokumentasi lengkap jejak masalah, tindakan teknisi, hasil perbaikan, dan foto bukti lampiran
          </p>
        </div>
      </div>

      {/* Repair Table */}
      <RepairTable
        onOpenAddModal={handleOpenAdd}
        onOpenEditModal={handleOpenEdit}
      />

      {/* Add / Edit Repair Modal */}
      <AddRepairModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        recordToEdit={recordToEdit}
      />
    </div>
  );
}
