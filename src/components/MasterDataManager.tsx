/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Edit2,
  GraduationCap,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  GuruBerhalangan,
  HariAktif,
  KategoriMapel,
  MasterGuru,
  MasterKelas,
  MasterMapel,
  MasterWaktu,
  TipeSesi,
} from '../types/scheduler';

interface DeleteTarget {
  type: 'guru' | 'mapel' | 'kelas' | 'waktu';
  id: string;
  name: string;
  label: string;
  code?: string;
  details?: string;
}

interface Props {
  guruList: MasterGuru[];
  mapelList: MasterMapel[];
  kelasList: MasterKelas[];
  waktuList: MasterWaktu[];
  onUpdateGuruList: (list: MasterGuru[]) => void;
  onUpdateMapelList: (list: MasterMapel[]) => void;
  onUpdateKelasList: (list: MasterKelas[]) => void;
  onUpdateWaktuList: (list: MasterWaktu[]) => void;
}

export const MasterDataManager: React.FC<Props> = ({
  guruList,
  mapelList,
  kelasList,
  waktuList,
  onUpdateGuruList,
  onUpdateMapelList,
  onUpdateKelasList,
  onUpdateWaktuList,
}) => {
  const [activeTab, setActiveTab] = useState<'guru' | 'mapel' | 'kelas' | 'waktu'>('guru');

  // Teacher availability states
  const [selectedGuruId, setSelectedGuruId] = useState<string>(guruList[0]?.id || '');
  const activeGuru = guruList.find((g) => g.id === selectedGuruId) || guruList[0];

  const days: HariAktif[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const maxSesi = Math.max(...waktuList.map((w) => w.sesi_ke), 11);
  const sessionNumbers = Array.from({ length: maxSesi }, (_, i) => i + 1);

  // Modal states for CRUD
  const [isAddGuruOpen, setIsAddGuruOpen] = useState(false);
  const [isAddMapelOpen, setIsAddMapelOpen] = useState(false);
  const [isAddKelasOpen, setIsAddKelasOpen] = useState(false);

  // In-App Confirmation Modal state for Deletion (replaces window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Time editing state: active day filter
  const [selectedDayTime, setSelectedDayTime] = useState<HariAktif>('Senin');
  const [isEditWaktuOpen, setIsEditWaktuOpen] = useState(false);
  const [editingWaktuItem, setEditingWaktuItem] = useState<MasterWaktu | null>(null);

  // Forms
  // 1. Guru Form
  const [formNamaGuru, setFormNamaGuru] = useState('');
  const [formKodeGuru, setFormKodeGuru] = useState('');
  const [formNipGuru, setFormNipGuru] = useState('');
  const [formMaxJtm, setFormMaxJtm] = useState(24);
  const [formWarnaGuru, setFormWarnaGuru] = useState('#2563eb');

  // 2. Mapel Form
  const [formNamaMapel, setFormNamaMapel] = useState('');
  const [formKodeMapel, setFormKodeMapel] = useState('');
  const [formKategoriMapel, setFormKategoriMapel] = useState<KategoriMapel>('Reguler');
  const [formDefaultBlok, setFormDefaultBlok] = useState(2);
  const [formWarnaMapel, setFormWarnaMapel] = useState('#3b82f6');

  // 3. Kelas Form
  const [formNamaKelas, setFormNamaKelas] = useState('');
  const [formTingkatKelas, setFormTingkatKelas] = useState('X');
  const [formJurusanKelas, setFormJurusanKelas] = useState('');

  // 4. Waktu Form
  const [formSesiKe, setFormSesiKe] = useState(1);
  const [formJamMulai, setFormJamMulai] = useState('07:00');
  const [formJamSelesai, setFormJamSelesai] = useState('07:45');
  const [formTipeSesi, setFormTipeSesi] = useState<TipeSesi>('belajar');
  const [formLabelSesi, setFormLabelSesi] = useState('');

  // Toggle teacher unavailability for a slot
  const handleToggleUnavailability = (hari: HariAktif, sesi: number) => {
    if (!activeGuru) return;

    const currentBerhalangan: GuruBerhalangan[] = [...(activeGuru.berhalangan || [])];
    const dayEntryIndex = currentBerhalangan.findIndex((b) => b.hari === hari);

    if (dayEntryIndex >= 0) {
      const entry = { ...currentBerhalangan[dayEntryIndex] };
      if (entry.sesi.includes(sesi)) {
        entry.sesi = entry.sesi.filter((s) => s !== sesi);
        if (entry.sesi.length === 0) {
          currentBerhalangan.splice(dayEntryIndex, 1);
        } else {
          currentBerhalangan[dayEntryIndex] = entry;
        }
      } else {
        entry.sesi = [...entry.sesi, sesi].sort((a, b) => a - b);
        currentBerhalangan[dayEntryIndex] = entry;
      }
    } else {
      currentBerhalangan.push({
        hari,
        sesi: [sesi],
        keterangan: 'Tugas Luar / Berhalangan Mengajar',
      });
    }

    const updatedList = guruList.map((g) =>
      g.id === activeGuru.id ? { ...g, berhalangan: currentBerhalangan } : g
    );
    onUpdateGuruList(updatedList);
  };

  const isSlotUnavailable = (hari: HariAktif, sesi: number): boolean => {
    if (!activeGuru || !activeGuru.berhalangan) return false;
    const entry = activeGuru.berhalangan.find((b) => b.hari === hari);
    return Boolean(entry?.sesi.includes(sesi));
  };

  // --- CRUD GURU ---
  const handleSaveGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaGuru || !formKodeGuru) return;

    const newGuru: MasterGuru = {
      id: `g-${Date.now()}`,
      nama_guru: formNamaGuru.trim(),
      kode_guru: formKodeGuru.trim().toUpperCase(),
      max_jtm: formMaxJtm,
      nip: formNipGuru.trim(),
      warna_tag: formWarnaGuru,
      berhalangan: [],
    };

    onUpdateGuruList([...guruList, newGuru]);
    setSelectedGuruId(newGuru.id);
    setIsAddGuruOpen(false);
    setFormNamaGuru('');
    setFormKodeGuru('');
    setFormNipGuru('');
  };

  // Execution of in-app deletion
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'guru') {
      const filtered = guruList.filter((g) => g.id !== deleteTarget.id);
      onUpdateGuruList(filtered);
      if (selectedGuruId === deleteTarget.id) {
        setSelectedGuruId(filtered[0]?.id || '');
      }
    } else if (deleteTarget.type === 'mapel') {
      onUpdateMapelList(mapelList.filter((m) => m.id !== deleteTarget.id));
    } else if (deleteTarget.type === 'kelas') {
      onUpdateKelasList(kelasList.filter((k) => k.id !== deleteTarget.id));
    } else if (deleteTarget.type === 'waktu') {
      onUpdateWaktuList(waktuList.filter((w) => w.id !== deleteTarget.id));
    }

    setDeleteTarget(null);
  };

  const handleDeleteGuru = (id: string) => {
    const g = guruList.find((x) => x.id === id);
    if (!g) return;
    setDeleteTarget({
      type: 'guru',
      id: g.id,
      name: g.nama_guru,
      label: 'Guru Pengampu',
      code: g.kode_guru,
      details: `Batas Beban: ${g.max_jtm} JTM/minggu • NIP: ${g.nip || '-'}`,
    });
  };

  // --- CRUD MAPEL ---
  const handleSaveMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaMapel) return;

    const newMapel: MasterMapel = {
      id: `m-${Date.now()}`,
      nama_mapel: formNamaMapel.trim(),
      kode_mapel: formKodeMapel.trim().toUpperCase() || formNamaMapel.slice(0, 4).toUpperCase(),
      kategori: formKategoriMapel,
      default_blok: formDefaultBlok,
      warna: formWarnaMapel,
    };

    onUpdateMapelList([...mapelList, newMapel]);
    setIsAddMapelOpen(false);
    setFormNamaMapel('');
    setFormKodeMapel('');
  };

  const handleDeleteMapel = (id: string) => {
    const m = mapelList.find((x) => x.id === id);
    if (!m) return;
    setDeleteTarget({
      type: 'mapel',
      id: m.id,
      name: m.nama_mapel,
      label: 'Mata Pelajaran',
      code: m.kode_mapel,
      details: `Kategori: ${m.kategori} • Default Blok: ${m.default_blok || 2} Jam`,
    });
  };

  // --- CRUD KELAS ---
  const handleSaveKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaKelas) return;

    const newKelas: MasterKelas = {
      id: `k-${Date.now()}`,
      nama_kelas: formNamaKelas.trim(),
      tingkat: formTingkatKelas,
      jurusan: formJurusanKelas.trim() || 'Umum',
    };

    onUpdateKelasList([...kelasList, newKelas]);
    setIsAddKelasOpen(false);
    setFormNamaKelas('');
    setFormJurusanKelas('');
  };

  const handleDeleteKelas = (id: string) => {
    const k = kelasList.find((x) => x.id === id);
    if (!k) return;
    setDeleteTarget({
      type: 'kelas',
      id: k.id,
      name: k.nama_kelas,
      label: 'Rombel Kelas',
      details: `Tingkat ${k.tingkat} • Jurusan: ${k.jurusan || 'Umum'}`,
    });
  };

  // --- EDIT WAKTU PER HARI ---
  const filteredWaktuDay = waktuList
    .filter((w) => w.hari === selectedDayTime)
    .sort((a, b) => a.sesi_ke - b.sesi_ke);

  const handleOpenAddWaktu = () => {
    const nextSesi = filteredWaktuDay.length > 0 ? Math.max(...filteredWaktuDay.map((w) => w.sesi_ke)) + 1 : 1;
    setEditingWaktuItem(null);
    setFormSesiKe(nextSesi);
    setFormJamMulai('07:00');
    setFormJamSelesai('07:45');
    setFormTipeSesi('belajar');
    setFormLabelSesi(`Jam ke-${nextSesi}`);
    setIsEditWaktuOpen(true);
  };

  const handleOpenEditWaktu = (w: MasterWaktu) => {
    setEditingWaktuItem(w);
    setFormSesiKe(w.sesi_ke);
    setFormJamMulai(w.jam_mulai);
    setFormJamSelesai(w.jam_selesai);
    setFormTipeSesi(w.tipe_sesi);
    setFormLabelSesi(w.label || '');
    setIsEditWaktuOpen(true);
  };

  const handleSaveWaktu = (e: React.FormEvent) => {
    e.preventDefault();
    const isIstirahat = formTipeSesi !== 'belajar';

    if (editingWaktuItem) {
      // Update
      const updated = waktuList.map((w) =>
        w.id === editingWaktuItem.id
          ? {
              ...w,
              sesi_ke: formSesiKe,
              jam_mulai: formJamMulai,
              jam_selesai: formJamSelesai,
              is_istirahat: isIstirahat,
              tipe_sesi: formTipeSesi,
              label: formLabelSesi,
            }
          : w
      );
      onUpdateWaktuList(updated);
    } else {
      // Add
      const newW: MasterWaktu = {
        id: `w-${selectedDayTime.toLowerCase()}-${formSesiKe}-${Date.now()}`,
        hari: selectedDayTime,
        sesi_ke: formSesiKe,
        jam_mulai: formJamMulai,
        jam_selesai: formJamSelesai,
        is_istirahat: isIstirahat,
        tipe_sesi: formTipeSesi,
        label: formLabelSesi || `Jam ke-${formSesiKe}`,
      };
      onUpdateWaktuList([...waktuList, newW]);
    }

    setIsEditWaktuOpen(false);
  };

  const handleDeleteWaktu = (id: string) => {
    const w = waktuList.find((x) => x.id === id);
    if (!w) return;
    setDeleteTarget({
      type: 'waktu',
      id: w.id,
      name: `${w.hari} Sesi ${w.sesi_ke} (${w.jam_mulai} - ${w.jam_selesai})`,
      label: 'Sesi Waktu',
      details: `Tipe: ${w.tipe_sesi.toUpperCase()} • Label: ${w.label || '-'}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('guru')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'guru'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Guru & Ketersediaan ({guruList.length})
          </button>
          <button
            onClick={() => setActiveTab('mapel')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mapel'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Mata Pelajaran ({mapelList.length})
          </button>
          <button
            onClick={() => setActiveTab('kelas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'kelas'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Kelas ({kelasList.length})
          </button>
          <button
            onClick={() => setActiveTab('waktu')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'waktu'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Edit Waktu Per Hari ({waktuList.length} Slot)
          </button>
        </div>

        {/* Action Button based on tab */}
        {activeTab === 'guru' && (
          <button
            onClick={() => setIsAddGuruOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Guru Baru
          </button>
        )}

        {activeTab === 'mapel' && (
          <button
            onClick={() => setIsAddMapelOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Mata Pelajaran
          </button>
        )}

        {activeTab === 'kelas' && (
          <button
            onClick={() => setIsAddKelasOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Kelas Baru
          </button>
        )}

        {activeTab === 'waktu' && (
          <button
            onClick={handleOpenAddWaktu}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Slot Sesi ({selectedDayTime})
          </button>
        )}
      </div>

      {/* Tab Content: GURU & KETERSEDIAAN */}
      {activeTab === 'guru' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teacher List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Daftar Guru Pengampu</h3>
              <span className="text-xs text-slate-500">{guruList.length} Guru</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {guruList.map((g) => {
                const isSelected = g.id === activeGuru?.id;
                const totalUnavail =
                  g.berhalangan?.reduce((acc, b) => acc + b.sesi.length, 0) || 0;

                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGuruId(g.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-400 shadow-xs ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 truncate">{g.nama_guru}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {g.kode_guru}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGuru(g.id);
                          }}
                          className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Max {g.max_jtm} JTM/minggu</span>
                      {totalUnavail > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          {totalUnavail} Sesi Berhalangan
                        </span>
                      ) : (
                        <span className="text-emerald-600">Selalu Siap</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Availability Matrix */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            {activeGuru && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Matriks Ketersediaan Guru: {activeGuru.nama_guru}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Klik pada slot kotak sesi untuk menandai guru <strong>Berhalangan Mengajar</strong> (merah).
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteGuru(activeGuru.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors shadow-2xs"
                      title={`Hapus ${activeGuru.nama_guru} dari Master Data`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Guru</span>
                    </button>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" />
                      Tersedia
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-3 h-3 rounded-sm bg-rose-500 border border-rose-600" />
                      Berhalangan
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="p-2 w-16">Sesi</th>
                        {days.map((hari) => (
                          <th key={hari} className="p-2 font-bold">
                            {hari}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessionNumbers.map((sesi) => (
                        <tr key={sesi} className="hover:bg-slate-50/50">
                          <td className="p-2 font-bold text-slate-400">Jam {sesi}</td>
                          {days.map((hari) => {
                            const isUnavailable = isSlotUnavailable(hari, sesi);
                            const waktuObj = waktuList.find(
                              (w) => w.hari === hari && w.sesi_ke === sesi
                            );

                            if (waktuObj?.is_istirahat) {
                              return (
                                <td
                                  key={hari}
                                  className="p-1 bg-amber-50/50 text-[10px] text-amber-800 font-medium select-none"
                                >
                                  {waktuObj.label || 'Istirahat'}
                                </td>
                              );
                            }

                            return (
                              <td key={hari} className="p-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleUnavailability(hari, sesi)}
                                  className={`w-full py-2 px-1 rounded-lg font-bold text-[11px] transition-all ${
                                    isUnavailable
                                      ? 'bg-rose-500 text-white shadow-xs hover:bg-rose-600'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {isUnavailable ? 'Berhalangan' : 'Bisa'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: MATA PELAJARAN */}
      {activeTab === 'mapel' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Master Mata Pelajaran (Reguler, Kejuruan, Keagamaan)
              </h3>
              <p className="text-xs text-slate-500">
                Kategori mata pelajaran beserta rekomendasi durasi blok jam berurutan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3">Kode</th>
                  <th className="p-3">Nama Mata Pelajaran</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-center">Default Blok</th>
                  <th className="p-3 text-center">Label Warna</th>
                  <th className="p-3 text-right w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mapelList.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-slate-700">{m.kode_mapel}</td>
                    <td className="p-3 font-semibold text-slate-900">{m.nama_mapel}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          m.kategori === 'Kejuruan'
                            ? 'bg-purple-100 text-purple-800'
                            : m.kategori === 'Keagamaan'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {m.kategori}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      {m.default_blok || 2} Jam Berurutan
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className="inline-block w-5 h-5 rounded-full border border-slate-300"
                        style={{ backgroundColor: m.warna || '#3b82f6' }}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteMapel(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus Mata Pelajaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: KELAS */}
      {activeTab === 'kelas' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Master Rombongan Belajar (Kelas)</h3>
              <p className="text-xs text-slate-500">Daftar kelas dan tingkat semester</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kelasList.map((k) => (
              <div
                key={k.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 relative group hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-base text-slate-900">{k.nama_kelas}</span>
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      Tingkat {k.tingkat}
                    </span>
                    <button
                      onClick={() => handleDeleteKelas(k.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{k.jurusan || 'Semua Jurusan'}</p>
                <p className="text-[10px] text-slate-400 font-mono">ID: {k.id}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: EDIT WAKTU PER HARI */}
      {activeTab === 'waktu' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Pengaturan & Edit Sesi Waktu Per Hari
            </h3>
            <p className="text-xs text-slate-500">
              Pilih hari untuk menyesuaikan rentang jam mulai-selesai, jam istirahat, upacara, atau ibadah sholat jamaah.
            </p>
          </div>

          {/* Day Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-600 mr-2">Pilih Hari:</span>
            {days.map((d) => {
              const count = waktuList.filter((w) => w.hari === d).length;
              const isSelected = selectedDayTime === d;

              return (
                <button
                  key={d}
                  onClick={() => setSelectedDayTime(d)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{d}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'
                    }`}
                  >
                    {count} Sesi
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table of Sessions for Selected Day */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3 w-16 text-center">Sesi</th>
                  <th className="p-3">Rentang Jam</th>
                  <th className="p-3">Tipe Sesi</th>
                  <th className="p-3">Label Sesi</th>
                  <th className="p-3 text-center">Status KBM</th>
                  <th className="p-3 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWaktuDay.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      Belum ada sesi waktu untuk hari {selectedDayTime}. Silakan klik &quot;Tambah Slot Sesi&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredWaktuDay.map((w) => (
                    <tr
                      key={w.id}
                      className={w.is_istirahat ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'}
                    >
                      <td className="p-3 text-center font-bold text-slate-700">Jam {w.sesi_ke}</td>
                      <td className="p-3 font-mono font-medium text-slate-800">
                        {w.jam_mulai} - {w.jam_selesai}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            w.tipe_sesi === 'upacara'
                              ? 'bg-red-100 text-red-800'
                              : w.tipe_sesi === 'sholat'
                              ? 'bg-emerald-100 text-emerald-800'
                              : w.tipe_sesi === 'istirahat'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {w.tipe_sesi}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{w.label || '-'}</td>
                      <td className="p-3 text-center">
                        {w.is_istirahat ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            Terkunci (Bukan KBM)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Aktif Mengajar
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditWaktu(w)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Edit Sesi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWaktu(w.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Hapus Sesi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH GURU */}
      {isAddGuruOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">Tambah Guru Baru</h3>
              <button
                onClick={() => setIsAddGuruOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGuru} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Guru (dengan Gelar)</label>
                <input
                  type="text"
                  required
                  value={formNamaGuru}
                  onChange={(e) => setFormNamaGuru(e.target.value)}
                  placeholder="Contoh: Dra. Hj. Ratna Dewi, M.Pd"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Guru</label>
                  <input
                    type="text"
                    required
                    value={formKodeGuru}
                    onChange={(e) => setFormKodeGuru(e.target.value)}
                    placeholder="G11"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max JTM Mingguan</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    required
                    value={formMaxJtm}
                    onChange={(e) => setFormMaxJtm(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                <input
                  type="text"
                  value={formNipGuru}
                  onChange={(e) => setFormNipGuru(e.target.value)}
                  placeholder="198501012010011001 (opsional)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warna Badge Guru</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formWarnaGuru}
                    onChange={(e) => setFormWarnaGuru(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-1"
                  />
                  <span className="font-mono text-slate-600">{formWarnaGuru}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddGuruOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MAPEL */}
      {isAddMapelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">Tambah Mata Pelajaran</h3>
              <button
                onClick={() => setIsAddMapelOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMapel} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formNamaMapel}
                  onChange={(e) => setFormNamaMapel(e.target.value)}
                  placeholder="Contoh: Pemodelan Perangkat Lunak"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Mapel</label>
                  <input
                    type="text"
                    value={formKodeMapel}
                    onChange={(e) => setFormKodeMapel(e.target.value)}
                    placeholder="PPL"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formKategoriMapel}
                    onChange={(e) => setFormKategoriMapel(e.target.value as KategoriMapel)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Reguler">Reguler</option>
                    <option value="Kejuruan">Kejuruan (Produktif)</option>
                    <option value="Keagamaan">Keagamaan</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Blok (Jam)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formDefaultBlok}
                    onChange={(e) => setFormDefaultBlok(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warna Badge</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formWarnaMapel}
                      onChange={(e) => setFormWarnaMapel(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-1"
                    />
                    <span className="font-mono text-slate-600">{formWarnaMapel}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMapelOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH KELAS */}
      {isAddKelasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">Tambah Rombel Kelas Baru</h3>
              <button
                onClick={() => setIsAddKelasOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKelas} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Rombel Kelas</label>
                <input
                  type="text"
                  required
                  value={formNamaKelas}
                  onChange={(e) => setFormNamaKelas(e.target.value)}
                  placeholder="Contoh: XII TKJ 2"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat</label>
                  <select
                    value={formTingkatKelas}
                    onChange={(e) => setFormTingkatKelas(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="X">Tingkat X (Kelas 10)</option>
                    <option value="XI">Tingkat XI (Kelas 11)</option>
                    <option value="XII">Tingkat XII (Kelas 12)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kompetensi Keahlian / Jurusan</label>
                  <input
                    type="text"
                    value={formJurusanKelas}
                    onChange={(e) => setFormJurusanKelas(e.target.value)}
                    placeholder="Teknik Komputer Jaringan"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddKelasOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT WAKTU PER HARI */}
      {isEditWaktuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingWaktuItem ? `Edit Sesi Hari ${selectedDayTime}` : `Tambah Sesi Hari ${selectedDayTime}`}
              </h3>
              <button
                onClick={() => setIsEditWaktuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWaktu} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sesi Ke-</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={formSesiKe}
                    onChange={(e) => setFormSesiKe(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={formJamMulai}
                    onChange={(e) => setFormJamMulai(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={formJamSelesai}
                    onChange={(e) => setFormJamSelesai(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipe Sesi</label>
                <select
                  value={formTipeSesi}
                  onChange={(e) => setFormTipeSesi(e.target.value as TipeSesi)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  <option value="belajar">Belajar (Jam Pelajaran KBM Aktif)</option>
                  <option value="istirahat">Istirahat (Kudapan / Santai)</option>
                  <option value="upacara">Upacara Bendera</option>
                  <option value="sholat">Ibadah / Sholat Jamaah (Dhuha / Dzuhur / Jumat)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Label Keterangan Sesi</label>
                <input
                  type="text"
                  value={formLabelSesi}
                  onChange={(e) => setFormLabelSesi(e.target.value)}
                  placeholder="Contoh: Sholat Dzuhur Jamaah atau Jam ke-1"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditWaktuOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  Simpan Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION MODAL FOR DELETION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 text-center mb-1">
              Hapus {deleteTarget.label}?
            </h3>

            <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus {deleteTarget.label.toLowerCase()}:
              <br />
              <strong className="text-slate-900 font-bold block mt-1 text-sm">
                {deleteTarget.code ? `[${deleteTarget.code}] ` : ''}{deleteTarget.name}
              </strong>
              {deleteTarget.details && (
                <span className="text-[11px] text-slate-400 block mt-1">
                  {deleteTarget.details}
                </span>
              )}
            </p>

            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-800 mb-5 leading-normal">
              Tindakan ini akan menghapus data dari master dan membersihkan plotting/jadwal pelajaran terkait.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
