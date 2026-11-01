/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CalendarCheck,
  Check,
  Clock,
  Download,
  MapPin,
  Plus,
  Printer,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { HariAktif, JadwalPiketItem, MasterGuru, SchoolProfile } from '../types/scheduler';

interface Props {
  piketList: JadwalPiketItem[];
  guruList: MasterGuru[];
  schoolProfile: SchoolProfile;
  onAddPiket: (item: JadwalPiketItem) => void;
  onDeletePiket: (id: string) => void;
  onAutoGeneratePiket?: () => void;
}

export const JadwalPiketManager: React.FC<Props> = ({
  piketList,
  guruList,
  schoolProfile,
  onAddPiket,
  onDeletePiket,
}) => {
  const [selectedHari, setSelectedHari] = useState<HariAktif | 'Semua'>('Semua');
  const [guruId, setGuruId] = useState(guruList[0]?.id || '');
  const [hari, setHari] = useState<HariAktif>('Senin');
  const [tugas, setTugas] = useState('Piket Gerbang & Kedisiplinan Pagi');
  const [lokasi, setLokasi] = useState('Gerbang Utama & Lobi');

  const days: HariAktif[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const guruMap = new Map(guruList.map((g) => [g.id, g]));

  const filteredPiket =
    selectedHari === 'Semua'
      ? piketList
      : piketList.filter((p) => p.hari === selectedHari);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guruId) return;

    const newItem: JadwalPiketItem = {
      id: `pkt-${Date.now()}`,
      hari,
      guru_id: guruId,
      tugas,
      lokasi,
    };
    onAddPiket(newItem);
  };

  const handlePrintPiket = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            <span>Jadwal Guru Piket Harian</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen penugasan piket guru harian, penjagaan gerbang, monitoring KBM kelas kosong, dan rekap piket mingguan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintPiket}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Jadwal Piket</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Tambah Guru Piket */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Petugas Piket</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Pilih hari dan guru yang bertugas piket harian
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hari Bertugas</label>
              <select
                value={hari}
                onChange={(e) => setHari(e.target.value as HariAktif)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-slate-50/50"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Guru</label>
              <select
                value={guruId}
                onChange={(e) => setGuruId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-slate-50/50"
              >
                {guruList.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.kode_guru}] {g.nama_guru}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Penugasan</label>
              <select
                value={tugas}
                onChange={(e) => setTugas(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-slate-50/50"
              >
                <option value="Piket Gerbang & Kedisiplinan Pagi">
                  Piket Gerbang & Kedisiplinan Pagi
                </option>
                <option value="Piket KBM & Jam Kosong">
                  Piket KBM & Jam Kosong
                </option>
                <option value="Piket Monitoring Lingkungan & Kebersihan">
                  Piket Monitoring Lingkungan & Kebersihan
                </option>
                <option value="Piket Pelayanan Tamu & Izin Siswa">
                  Piket Pelayanan Tamu & Izin Siswa
                </option>
                <option value="Piket Ibadah Sholat Jamaah & Musholla">
                  Piket Ibadah Sholat Jamaah & Musholla
                </option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pos / Lokasi Tugas</label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Gerbang Utama / Ruang Piket"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs mt-2"
            >
              Simpan Jadwal Piket
            </button>
          </form>
        </div>

        {/* Tabel Rekap Piket Mingguan */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Daftar Guru Piket ({filteredPiket.length} Petugas)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {schoolProfile.nama_sekolah} &bull; Semester {schoolProfile.semester} TP {schoolProfile.tahun_ajaran}
              </p>
            </div>

            {/* Filter Hari */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSelectedHari('Semua')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedHari === 'Semua'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedHari(d)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    selectedHari === d
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2.5 px-3">Hari</th>
                  <th className="py-2.5 px-3">Nama Guru Piket</th>
                  <th className="py-2.5 px-3">Tugas Piket</th>
                  <th className="py-2.5 px-3">Lokasi</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPiket.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Belum ada guru yang ditugaskan piket pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredPiket.map((p) => {
                    const guru = guruMap.get(p.guru_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                            {p.hari}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <div>{guru?.nama_guru || 'Guru tidak ditemukan'}</div>
                          <div className="text-[10px] text-slate-400">Kode: {guru?.kode_guru} | NIP: {guru?.nip || '-'}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {p.tugas}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {p.lokasi || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeletePiket(p.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus Penugasan Piket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
