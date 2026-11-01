/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Download,
  Edit2,
  Edit3,
  Filter,
  GraduationCap,
  Plus,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  HariAktif,
  JadwalTersusunItem,
  MasterGuru,
  MasterKelas,
  MasterMapel,
  MasterWaktu,
  SchoolProfile,
  TipeSesi,
} from '../types/scheduler';
import { PrintPdfModal } from './PrintPdfModal';

interface Props {
  jadwal: JadwalTersusunItem[];
  waktuList: MasterWaktu[];
  kelasList: MasterKelas[];
  guruList: MasterGuru[];
  mapelList: MasterMapel[];
  schoolProfile?: SchoolProfile;
  onUpdateWaktuList?: (list: MasterWaktu[]) => void;
  onManualSelectSlot?: (hari: HariAktif, sesi: number, kelasId: string) => void;
}

export const TimetableGrid: React.FC<Props> = ({
  jadwal,
  waktuList,
  kelasList,
  guruList,
  mapelList,
  schoolProfile,
  onUpdateWaktuList,
}) => {
  const [viewMode, setViewMode] = useState<'kelas' | 'guru' | 'master'>('kelas');
  const [selectedKelasId, setSelectedKelasId] = useState<string>(kelasList[0]?.id || '');
  const [selectedGuruId, setSelectedGuruId] = useState<string>(guruList[0]?.id || '');
  const [highlightDay, setHighlightDay] = useState<HariAktif | 'ALL'>('ALL');

  // PDF Modal state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Day Time Editor Modal state (Hari sebagai tombol edit waktu)
  const [editingDayTime, setEditingDayTime] = useState<HariAktif | null>(null);

  const days: HariAktif[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  // Map lookups for fast retrieval
  const guruMap = new Map(guruList.map((g) => [g.id, g]));
  const mapelMap = new Map(mapelList.map((m) => [m.id, m]));
  const kelasMap = new Map(kelasList.map((k) => [k.id, k]));

  // Find max session across all days
  const maxSesi = Math.max(...waktuList.map((w) => w.sesi_ke), 11);
  const sessionNumbers = Array.from({ length: maxSesi }, (_, i) => i + 1);

  // Helper to find scheduled item
  const findItemForKelas = (hari: HariAktif, sesi: number, kelasId: string) => {
    return jadwal.find((j) => j.hari === hari && j.sesi === sesi && j.kelas_id === kelasId);
  };

  const findItemForGuru = (hari: HariAktif, sesi: number, guruId: string) => {
    return jadwal.find((j) => j.hari === hari && j.sesi === sesi && j.guru_id === guruId);
  };

  const handlePrint = () => {
    setIsPdfModalOpen(true);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Hari', 'Sesi Ke', 'Jam', 'Kelas', 'Mata Pelajaran', 'Kode Guru', 'Nama Guru'],
    ];

    jadwal.forEach((item) => {
      const w = waktuList.find((x) => x.hari === item.hari && x.sesi_ke === item.sesi);
      const k = kelasMap.get(item.kelas_id);
      const m = mapelMap.get(item.mapel_id);
      const g = guruMap.get(item.guru_id);

      rows.push([
        item.hari,
        `Sesi ${item.sesi}`,
        w ? `${w.jam_mulai} - ${w.jam_selesai}` : '-',
        k?.nama_kelas || item.kelas_id,
        m?.nama_mapel || item.mapel_id,
        g?.kode_guru || '-',
        g?.nama_guru || item.guru_id,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jadwal_pelajaran_${viewMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeKelas = kelasMap.get(selectedKelasId);
  const activeGuru = guruMap.get(selectedGuruId);

  // Calculate current teaching hours for selected guru
  const guruTeachingHours = jadwal.filter((j) => j.guru_id === selectedGuruId).length;

  // Day Time editing helpers
  const daySessionsToEdit = editingDayTime
    ? waktuList.filter((w) => w.hari === editingDayTime).sort((a, b) => a.sesi_ke - b.sesi_ke)
    : [];

  const handleUpdateSessionInDay = (
    waktuId: string,
    updates: Partial<MasterWaktu>
  ) => {
    if (!onUpdateWaktuList) return;
    const updated = waktuList.map((w) => (w.id === waktuId ? { ...w, ...updates } : w));
    onUpdateWaktuList(updated);
  };

  const handleDeleteSessionInDay = (waktuId: string) => {
    if (!onUpdateWaktuList) return;
    onUpdateWaktuList(waktuList.filter((w) => w.id !== waktuId));
  };

  const handleAddSessionInDay = () => {
    if (!onUpdateWaktuList || !editingDayTime) return;
    const maxS =
      daySessionsToEdit.length > 0
        ? Math.max(...daySessionsToEdit.map((w) => w.sesi_ke)) + 1
        : 1;

    const newSlot: MasterWaktu = {
      id: `w-${editingDayTime.toLowerCase()}-${maxS}-${Date.now()}`,
      hari: editingDayTime,
      sesi_ke: maxS,
      jam_mulai: '13:00',
      jam_selesai: '13:45',
      is_istirahat: false,
      tipe_sesi: 'belajar',
      label: `Jam ke-${maxS}`,
    };

    onUpdateWaktuList([...waktuList, newSlot]);
  };

  // Preset Template applicator (e.g. Friday short 40-minute schedule)
  const applyTemplateToDay = (presetType: '45min' | '40min' | 'jumat') => {
    if (!onUpdateWaktuList || !editingDayTime) return;

    let newSlots: MasterWaktu[] = [];

    if (presetType === 'jumat') {
      newSlots = [
        { id: `w-${editingDayTime}-1-${Date.now()}`, hari: editingDayTime, sesi_ke: 1, jam_mulai: '07:00', jam_selesai: '07:40', is_istirahat: false, tipe_sesi: 'belajar', label: 'Jam ke-1' },
        { id: `w-${editingDayTime}-2-${Date.now()}`, hari: editingDayTime, sesi_ke: 2, jam_mulai: '07:40', jam_selesai: '08:20', is_istirahat: false, tipe_sesi: 'belajar', label: 'Jam ke-2' },
        { id: `w-${editingDayTime}-3-${Date.now()}`, hari: editingDayTime, sesi_ke: 3, jam_mulai: '08:20', jam_selesai: '09:00', is_istirahat: false, tipe_sesi: 'belajar', label: 'Jam ke-3' },
        { id: `w-${editingDayTime}-4-${Date.now()}`, hari: editingDayTime, sesi_ke: 4, jam_mulai: '09:00', jam_selesai: '09:20', is_istirahat: true, tipe_sesi: 'istirahat', label: 'Istirahat Kudapan' },
        { id: `w-${editingDayTime}-5-${Date.now()}`, hari: editingDayTime, sesi_ke: 5, jam_mulai: '09:20', jam_selesai: '10:00', is_istirahat: false, tipe_sesi: 'belajar', label: 'Jam ke-4' },
        { id: `w-${editingDayTime}-6-${Date.now()}`, hari: editingDayTime, sesi_ke: 6, jam_mulai: '10:00', jam_selesai: '10:40', is_istirahat: false, tipe_sesi: 'belajar', label: 'Jam ke-5' },
        { id: `w-${editingDayTime}-7-${Date.now()}`, hari: editingDayTime, sesi_ke: 7, jam_mulai: '10:40', jam_selesai: '12:30', is_istirahat: true, tipe_sesi: 'sholat', label: 'Sholat Jumat Berjamaah' },
      ];
    } else {
      // 45 min regular
      const startH = 7;
      let curMinute = 0;
      for (let s = 1; s <= 9; s++) {
        const startStr = `${String(startH + Math.floor(curMinute / 60)).padStart(2, '0')}:${String(curMinute % 60).padStart(2, '0')}`;
        curMinute += (presetType === '40min' ? 40 : 45);
        const endStr = `${String(startH + Math.floor(curMinute / 60)).padStart(2, '0')}:${String(curMinute % 60).padStart(2, '0')}`;
        const isBreak = s === 4 || s === 7;
        newSlots.push({
          id: `w-${editingDayTime}-${s}-${Date.now()}`,
          hari: editingDayTime,
          sesi_ke: s,
          jam_mulai: startStr,
          jam_selesai: endStr,
          is_istirahat: isBreak,
          tipe_sesi: isBreak ? (s === 7 ? 'sholat' : 'istirahat') : 'belajar',
          label: isBreak ? (s === 7 ? 'Dzuhur Jamaah' : 'Istirahat Dhuha') : `Jam ke-${s}`,
        });
      }
    }

    // Replace slots for this day
    const otherDays = waktuList.filter((w) => w.hari !== editingDayTime);
    onUpdateWaktuList([...otherDays, ...newSlots]);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode('kelas')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'kelas'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Per Kelas
            </button>
            <button
              onClick={() => setViewMode('guru')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'guru'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Per Guru
            </button>
            <button
              onClick={() => setViewMode('master')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'master'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Matriks Master
            </button>
          </div>

          {/* Selector based on viewMode */}
          {viewMode === 'kelas' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Pilih Kelas:
              </span>
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas} ({k.jurusan || k.tingkat})
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'guru' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Pilih Guru:
              </span>
              <select
                value={selectedGuruId}
                onChange={(e) => setSelectedGuruId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {guruList.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.kode_guru}] {g.nama_guru} ({g.max_jtm} JTM)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Ekspor CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak ke PDF
          </button>
        </div>
      </div>

      {/* Info Badge Bar */}
      {viewMode === 'kelas' && activeKelas && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {activeKelas.nama_kelas.slice(0, 4)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Jadwal Mingguan Kelas {activeKelas.nama_kelas}
              </h3>
              <p className="text-xs text-emerald-700">
                {activeKelas.jurusan || 'Reguler'} &bull; Tingkat {activeKelas.tingkat}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-600">
              Total Beban Belajar:{' '}
              <strong className="text-emerald-800 font-bold">
                {jadwal.filter((j) => j.kelas_id === selectedKelasId).length} Jam (JTM) / Minggu
              </strong>
            </span>
          </div>
        </div>
      )}

      {viewMode === 'guru' && activeGuru && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg text-white flex items-center justify-center font-bold text-sm shadow-xs"
              style={{ backgroundColor: activeGuru.warna_tag || '#2563eb' }}
            >
              {activeGuru.kode_guru}
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-950">
                Jadwal Mengajar: {activeGuru.nama_guru}
              </h3>
              <p className="text-xs text-blue-700">
                NIP: {activeGuru.nip || '-'} &bull; Kode: {activeGuru.kode_guru}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-600">
              Beban Terjadwal:{' '}
              <strong className="text-blue-900 font-bold">
                {guruTeachingHours} / {activeGuru.max_jtm} JTM
              </strong>
            </span>
            <div className="w-28 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  guruTeachingHours > activeGuru.max_jtm
                    ? 'bg-red-500'
                    : guruTeachingHours === activeGuru.max_jtm
                    ? 'bg-emerald-500'
                    : 'bg-blue-600'
                }`}
                style={{
                  width: `${Math.min(100, (guruTeachingHours / activeGuru.max_jtm) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Guide Banner for Clickable Day Buttons */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Durasi Waktu Berbeda Setiap Hari:</strong> Kolom hari di bawah ini berfungsi sebagai <strong>tombol interaktif</strong>. Klik nama hari (Senin, Selasa, dst.) untuk menyesuaikan durasi jam, jam istirahat, atau sholat jamaah khusus hari tersebut.
          </span>
        </div>
      </div>

      {/* Main Grid Table (Per Kelas or Per Guru) */}
      {(viewMode === 'kelas' || viewMode === 'guru') && (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-700">
                <th className="p-3 w-16 text-center border-r border-slate-200">Sesi</th>
                {days.map((hari) => {
                  const daySlots = waktuList.filter((w) => w.hari === hari);
                  const firstSlot = daySlots[0];
                  const lastSlot = daySlots[daySlots.length - 1];

                  return (
                    <th
                      key={hari}
                      className={`p-2 text-center border-r border-slate-200 last:border-r-0 ${
                        hari === 'Jumat' ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setEditingDayTime(hari)}
                        className="w-full group p-2 rounded-xl border border-transparent hover:border-emerald-400 hover:bg-emerald-50 transition-all text-slate-800 hover:text-emerald-950 flex flex-col items-center justify-center cursor-pointer"
                        title={`Klik untuk edit durasi & sesi waktu hari ${hari}`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-sm">
                          <span>{hari}</span>
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-emerald-700 font-mono mt-0.5">
                          <span>
                            {firstSlot ? firstSlot.jam_mulai : '07:00'} -{' '}
                            {lastSlot ? lastSlot.jam_selesai : '14:45'}
                          </span>
                        </div>
                        <span className="text-[9px] text-emerald-600 font-bold bg-white/80 group-hover:bg-emerald-100 px-1.5 py-0.2 rounded mt-1">
                          Edit Waktu
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sessionNumbers.map((sesi) => {
                return (
                  <tr key={sesi} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200 bg-slate-50/40">
                      Jam {sesi}
                    </td>

                    {days.map((hari) => {
                      const waktu = waktuList.find((w) => w.hari === hari && w.sesi_ke === sesi);

                      if (!waktu) {
                        return (
                          <td
                            key={hari}
                            className="p-2 bg-slate-50/30 text-slate-300 text-center border-r border-slate-200 last:border-r-0"
                          >
                            <span className="text-[10px] italic">Tidak ada sesi</span>
                          </td>
                        );
                      }

                      // Check if it's break or prayer
                      if (waktu.is_istirahat) {
                        return (
                          <td
                            key={hari}
                            className="p-2.5 text-center border-r border-slate-200 last:border-r-0 bg-amber-50/50 text-amber-900 font-medium select-none"
                          >
                            <div className="font-mono text-[10px] text-amber-700 font-bold mb-0.5">
                              {waktu.jam_mulai} - {waktu.jam_selesai}
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{waktu.label || 'Istirahat'}</span>
                            </div>
                          </td>
                        );
                      }

                      // In Teacher mode, check if teacher is unavailable on this slot
                      if (viewMode === 'guru' && activeGuru?.berhalangan) {
                        const unavail = activeGuru.berhalangan.find(
                          (u) => u.hari === hari && u.sesi.includes(sesi)
                        );
                        if (unavail) {
                          return (
                            <td
                              key={hari}
                              className="p-2.5 text-center border-r border-slate-200 last:border-r-0 bg-rose-50/60 text-rose-700 font-medium"
                            >
                              <div className="font-mono text-[10px] text-rose-500 font-bold mb-0.5">
                                {waktu.jam_mulai} - {waktu.jam_selesai}
                              </div>
                              <div className="text-[11px] font-semibold">Berhalangan</div>
                              <div className="text-[10px] text-rose-500">
                                {unavail.keterangan || 'Tidak bersedia'}
                              </div>
                            </td>
                          );
                        }
                      }

                      // Find scheduled item
                      const item =
                        viewMode === 'kelas'
                          ? findItemForKelas(hari, sesi, selectedKelasId)
                          : findItemForGuru(hari, sesi, selectedGuruId);

                      if (!item) {
                        return (
                          <td
                            key={hari}
                            className="p-2.5 text-center border-r border-slate-200 last:border-r-0 text-slate-300 hover:bg-emerald-50/20 cursor-default"
                          >
                            <div className="font-mono text-[10px] text-slate-400 font-semibold mb-0.5">
                              {waktu.jam_mulai} - {waktu.jam_selesai}
                            </div>
                            <span className="text-[11px] italic text-slate-400">Kosong</span>
                          </td>
                        );
                      }

                      const mapel = mapelMap.get(item.mapel_id);
                      const guru = guruMap.get(item.guru_id);
                      const kelas = kelasMap.get(item.kelas_id);

                      return (
                        <td
                          key={hari}
                          className="p-2 border-r border-slate-200 last:border-r-0 align-top"
                        >
                          <div
                            className="p-2 rounded-xl border transition-shadow hover:shadow-sm"
                            style={{
                              backgroundColor: `${mapel?.warna || '#3b82f6'}12`,
                              borderColor: `${mapel?.warna || '#3b82f6'}40`,
                            }}
                          >
                            {/* Day-specific start and end time */}
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1 border-b border-slate-200/60 pb-0.5">
                              <span>
                                {waktu.jam_mulai} - {waktu.jam_selesai}
                              </span>
                              <span className="text-[9px] font-sans font-bold text-slate-400">
                                {waktu.label || `Jam ${waktu.sesi_ke}`}
                              </span>
                            </div>

                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span
                                className="font-bold text-[11px] line-clamp-1"
                                style={{ color: mapel?.warna || '#1e3a8a' }}
                              >
                                {mapel?.nama_mapel || 'Pelajaran'}
                              </span>
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase"
                                style={{
                                  backgroundColor: `${mapel?.warna || '#3b82f6'}25`,
                                  color: mapel?.warna || '#1e3a8a',
                                }}
                              >
                                {mapel?.kode_mapel || 'MP'}
                              </span>
                            </div>

                            {viewMode === 'kelas' ? (
                              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                                <span className="truncate max-w-[110px]" title={guru?.nama_guru}>
                                  {guru?.nama_guru || 'Guru'}
                                </span>
                                <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-700">
                                  {guru?.kode_guru}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {kelas?.nama_kelas || item.kelas_id}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {kelas?.tingkat}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Master View (All Classes Side by Side) */}
      {viewMode === 'master' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filter Hari:</span>
              {(['ALL', ...days] as (HariAktif | 'ALL')[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setHighlightDay(d)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    highlightDay === d
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {d === 'ALL' ? 'Semua Hari (Senin-Jumat)' : d}
                </button>
              ))}
            </div>

            {/* Quick edit day button in master view */}
            {highlightDay !== 'ALL' && (
              <button
                onClick={() => setEditingDayTime(highlightDay)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Durasi Waktu {highlightDay}</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <th className="p-3 w-28 text-center border-r border-slate-200">Hari & Sesi</th>
                  <th className="p-3 w-28 text-center border-r border-slate-200">Waktu (Jam)</th>
                  {kelasList.map((k) => (
                    <th
                      key={k.id}
                      className="p-3 text-center border-r border-slate-200 last:border-r-0 font-bold text-slate-800"
                    >
                      {k.nama_kelas}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waktuList
                  .filter((w) => highlightDay === 'ALL' || w.hari === highlightDay)
                  .map((waktu) => {
                    return (
                      <tr
                        key={waktu.id}
                        className={waktu.is_istirahat ? 'bg-amber-50/30' : 'hover:bg-slate-50/40'}
                      >
                        <td className="p-2.5 text-center font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                          <button
                            onClick={() => setEditingDayTime(waktu.hari)}
                            className="hover:text-emerald-700 hover:underline flex items-center justify-center gap-1 mx-auto"
                            title={`Edit struktur waktu ${waktu.hari}`}
                          >
                            <span>{waktu.hari} ke-{waktu.sesi_ke}</span>
                            <Edit3 className="w-3 h-3 text-slate-400" />
                          </button>
                        </td>
                        <td className="p-2 text-center text-slate-700 font-mono text-[11px] font-bold border-r border-slate-200 whitespace-nowrap">
                          {waktu.jam_mulai} - {waktu.jam_selesai}
                        </td>

                        {waktu.is_istirahat ? (
                          <td
                            colSpan={kelasList.length}
                            className="p-2.5 text-center text-amber-800 font-semibold bg-amber-50/60"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{waktu.label || 'Istirahat / Sholat'}</span>
                            </div>
                          </td>
                        ) : (
                          kelasList.map((k) => {
                            const item = jadwal.find(
                              (j) =>
                                j.hari === waktu.hari &&
                                j.sesi === waktu.sesi_ke &&
                                j.kelas_id === k.id
                            );

                            if (!item) {
                              return (
                                <td
                                  key={k.id}
                                  className="p-2 text-center text-slate-300 border-r border-slate-200 last:border-r-0"
                                >
                                  -
                                </td>
                              );
                            }

                            const mapel = mapelMap.get(item.mapel_id);
                            const guru = guruMap.get(item.guru_id);

                            return (
                              <td
                                key={k.id}
                                className="p-2 border-r border-slate-200 last:border-r-0"
                              >
                                <div
                                  className="p-1.5 rounded-lg border text-[11px]"
                                  style={{
                                    backgroundColor: `${mapel?.warna || '#3b82f6'}12`,
                                    borderColor: `${mapel?.warna || '#3b82f6'}30`,
                                  }}
                                >
                                  <div
                                    className="font-bold truncate"
                                    style={{ color: mapel?.warna || '#1e3a8a' }}
                                  >
                                    {mapel?.kode_mapel || mapel?.nama_mapel}
                                  </div>
                                  <div className="text-[10px] text-slate-600 truncate flex items-center justify-between">
                                    <span>{guru?.kode_guru}</span>
                                    <span className="text-[9px] text-slate-400">
                                      {guru?.nama_guru.split(' ')[0]}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Print Preview Modal */}
      <PrintPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        jadwal={jadwal}
        waktuList={waktuList}
        kelasList={kelasList}
        guruList={guruList}
        mapelList={mapelList}
        schoolProfile={schoolProfile}
        initialMode={viewMode}
        initialTargetId={viewMode === 'kelas' ? selectedKelasId : selectedGuruId}
      />

      {/* DAY TIME EDITOR MODAL (Triggered when user clicks day header buttons) */}
      {editingDayTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Pengaturan Durasi Waktu Hari {editingDayTime}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur jam mulai, jam selesai, durasi per sesi, jam istirahat, upacara, dan sholat jamaah khusus hari {editingDayTime}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingDayTime(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Presets Bar */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700">Terapkan Template Cepat:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTemplateToDay('45min')}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:border-emerald-500 rounded-lg font-semibold text-slate-700 hover:text-emerald-700 transition-colors shadow-2xs"
                >
                  Reguler 45 Menit
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplateToDay('40min')}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:border-emerald-500 rounded-lg font-semibold text-slate-700 hover:text-emerald-700 transition-colors shadow-2xs"
                >
                  Singkat 40 Menit
                </button>
                {editingDayTime === 'Jumat' && (
                  <button
                    type="button"
                    onClick={() => applyTemplateToDay('jumat')}
                    className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold hover:bg-emerald-200 transition-colors shadow-2xs"
                  >
                    Format Sholat Jumat (Pulang Cepat)
                  </button>
                )}
              </div>
            </div>

            {/* Sessions Table inside Modal */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                    <th className="p-2.5 w-14 text-center">Sesi</th>
                    <th className="p-2.5 w-28">Jam Mulai</th>
                    <th className="p-2.5 w-28">Jam Selesai</th>
                    <th className="p-2.5">Tipe Sesi</th>
                    <th className="p-2.5">Label Keterangan</th>
                    <th className="p-2.5 text-right w-14">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daySessionsToEdit.map((slot) => (
                    <tr
                      key={slot.id}
                      className={slot.is_istirahat ? 'bg-amber-50/50' : 'hover:bg-slate-50/60'}
                    >
                      <td className="p-2 text-center font-bold text-slate-800">
                        Jam {slot.sesi_ke}
                      </td>
                      <td className="p-2">
                        <input
                          type="time"
                          value={slot.jam_mulai}
                          onChange={(e) =>
                            handleUpdateSessionInDay(slot.id, { jam_mulai: e.target.value })
                          }
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-mono text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="time"
                          value={slot.jam_selesai}
                          onChange={(e) =>
                            handleUpdateSessionInDay(slot.id, { jam_selesai: e.target.value })
                          }
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-mono text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={slot.tipe_sesi}
                          onChange={(e) => {
                            const newType = e.target.value as TipeSesi;
                            handleUpdateSessionInDay(slot.id, {
                              tipe_sesi: newType,
                              is_istirahat: newType !== 'belajar',
                            });
                          }}
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="belajar">Belajar (KBM)</option>
                          <option value="istirahat">Istirahat</option>
                          <option value="upacara">Upacara</option>
                          <option value="sholat">Ibadah / Sholat</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={slot.label || ''}
                          onChange={(e) =>
                            handleUpdateSessionInDay(slot.id, { label: e.target.value })
                          }
                          placeholder="e.g. Upacara / Sholat"
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSessionInDay(slot.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Hapus sesi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddSessionInDay}
                  className="w-full py-2 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors bg-emerald-50/50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sesi Baru Hari {editingDayTime}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 text-xs">
              <span className="text-slate-500">
                Total <strong>{daySessionsToEdit.length} sesi</strong> pada hari {editingDayTime}
              </span>
              <button
                type="button"
                onClick={() => setEditingDayTime(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
