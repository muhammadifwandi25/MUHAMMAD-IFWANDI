/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Save,
  School,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { MasterWaktu, SchoolProfile } from '../types/scheduler';

interface Props {
  profile: SchoolProfile;
  onSaveProfile: (profile: SchoolProfile) => void;
  waktuList: MasterWaktu[];
  onUpdateWaktuList: (waktu: MasterWaktu[]) => void;
}

export const SchoolProfileEditor: React.FC<Props> = ({
  profile,
  onSaveProfile,
  waktuList,
  onUpdateWaktuList,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'waktu'>('profile');
  const [formData, setFormData] = useState<SchoolProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Time slots editor state
  const [selectedHari, setSelectedHari] = useState<string>('Senin');

  const handleChange = (field: keyof SchoolProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const waktuHariIni = waktuList
    .filter((w) => w.hari === selectedHari)
    .sort((a, b) => a.sesi_ke - b.sesi_ke);

  const handleUpdateTimeSlot = (
    id: string,
    field: 'jam_mulai' | 'jam_selesai' | 'is_istirahat' | 'label',
    val: any
  ) => {
    const updated = waktuList.map((w) => {
      if (w.id === id) {
        return { ...w, [field]: val };
      }
      return w;
    });
    onUpdateWaktuList(updated);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs: Profil Sekolah vs Struktur Waktu */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <School className="w-6 h-6 text-emerald-600" />
            <span>Pengaturan Profil Sekolah & Waktu Belajar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan identitas satuan pendidikan, nama kepala sekolah untuk tanda tangan resmi, dan sesi jam pelajaran
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'profile'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Edit Profil Sekolah</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('waktu')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'waktu'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Struktur Waktu Sesi ({waktuList.length})</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Profil Sekolah berhasil diperbarui! Perubahan langsung diterapkan pada sidebar, kop dokumen, dan lembar cetak PDF.
          </span>
        </div>
      )}

      {activeSubTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Profil Sekolah */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Instansi Pemerintahan & Kop Surat Resmi</span>
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Kop Surat PDF
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pengaturan instansi pemerintahan tingkat atas yang disinkronkan langsung ke kepala surat (kop surat) cetak jadwal.
                </p>
              </div>

              {/* Input Instansi Pemerintahan & Dinas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/80">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Instansi Pemerintahan / Pemda / Kementerian <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Baris 1 Kop Surat</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.instansi_pemerintah || ''}
                    onChange={(e) => handleChange('instansi_pemerintah', e.target.value)}
                    placeholder="Contoh: PEMERINTAH ACEH atau PEMERINTAH PROVINSI JAWA BARAT"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-emerald-500 focus:border-emerald-500 bg-white shadow-2xs uppercase"
                  />
                  {/* Preset chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-medium">Contoh Cepat:</span>
                    <button
                      type="button"
                      onClick={() => handleChange('instansi_pemerintah', 'PEMERINTAH ACEH')}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-500 text-[10px] font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                    >
                      Pemerintah Aceh
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('instansi_pemerintah', 'PEMERINTAH DAERAH KHUSUS IBUKOTA JAKARTA')}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-500 text-[10px] font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                    >
                      Pemda DKI Jakarta
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('instansi_pemerintah', 'PEMERINTAH DAERAH PROVINSI')}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-500 text-[10px] font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                    >
                      Pemerintah Provinsi Umum
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('instansi_pemerintah', 'KEMENTERIAN AGAMA REPUBLIK INDONESIA')}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-500 text-[10px] font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                    >
                      Kemenag RI (Madrasah)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Dinas / Pengampu Pendidikan <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Baris 2 Kop Surat</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.dinas_pendidikan || ''}
                    onChange={(e) => handleChange('dinas_pendidikan', e.target.value)}
                    placeholder="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-emerald-500 bg-white shadow-2xs uppercase"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => handleChange('dinas_pendidikan', 'DINAS PENDIDIKAN DAN KEBUDAYAAN')}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-500 text-[10px] font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                    >
                      Dinas Pendidikan & Kebudayaan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('dinas_pendidikan', 'KANTOR WILAYAH KEMENTERIAN AGAMA')}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-500 text-[10px] font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                    >
                      Kanwil Kemenag
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Cabang Dinas / Balai Wilayah
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">Baris 3 (Opsional)</span>
                  </div>
                  <input
                    type="text"
                    value={formData.cabang_dinas || ''}
                    onChange={(e) => handleChange('cabang_dinas', e.target.value)}
                    placeholder="Contoh: CABANG DINAS WILAYAH KOTA BANDA ACEH"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-emerald-500 bg-white shadow-2xs uppercase"
                  />
                </div>
              </div>

              <div className="border-b border-slate-100 pt-2 pb-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span>Identitas Satuan Pendidikan</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Sekolah / Madrasah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_sekolah}
                    onChange={(e) => handleChange('nama_sekolah', e.target.value)}
                    placeholder="Contoh: SMA 1 BANDA ACEH"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-emerald-500 focus:border-emerald-500 bg-slate-50/50 uppercase"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Nama ini akan muncul pada header sidebar kiri dan baris utama nama sekolah pada kop surat.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenjang / Kategori Sekolah
                  </label>
                  <select
                    value={formData.jenjang}
                    onChange={(e) => handleChange('jenjang', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  >
                    <option value="MA/SMA">MA/SMA</option>
                    <option value="SMA">SMA</option>
                    <option value="MA">MA</option>
                    <option value="SMK">SMK</option>
                    <option value="SMP/MTs">SMP/MTs</option>
                    <option value="SMP">SMP</option>
                    <option value="MTs">MTs</option>
                    <option value="SD/MI">SD/MI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kota / Kabupaten Titi Mangsa
                  </label>
                  <input
                    type="text"
                    value={formData.kota_titi_mangsa || ''}
                    onChange={(e) => handleChange('kota_titi_mangsa', e.target.value)}
                    placeholder="Contoh: Banda Aceh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap Sekolah <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.alamat_sekolah}
                    onChange={(e) => handleChange('alamat_sekolah', e.target.value)}
                    placeholder="Contoh: Jl. Syiah Kuala No. 1, Bandar Baru, Kuta Alam, Kota Banda Aceh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Telepon Sekolah
                  </label>
                  <input
                    type="text"
                    value={formData.telepon || ''}
                    onChange={(e) => handleChange('telepon', e.target.value)}
                    placeholder="(0651) 22345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email / Website Resmi
                  </label>
                  <input
                    type="text"
                    value={formData.email_sekolah || ''}
                    onChange={(e) => handleChange('email_sekolah', e.target.value)}
                    placeholder="info@sman1bandaaceh.sch.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="border-b border-slate-100 pt-3 pb-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pimpinan Sekolah & Pengesahan Dokumen</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kepala Sekolah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_kepsek}
                    onChange={(e) => handleChange('nama_kepsek', e.target.value)}
                    placeholder="Drs. H. Syarifuddin, M.Pd."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={formData.nip_kepsek}
                    onChange={(e) => handleChange('nip_kepsek', e.target.value)}
                    placeholder="19700101 199503 1 001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Waka Kurikulum
                  </label>
                  <input
                    type="text"
                    value={formData.nama_waka_kurikulum || ''}
                    onChange={(e) => handleChange('nama_waka_kurikulum', e.target.value)}
                    placeholder="Muhammad Ifwandi, S.Pd., M.Pd."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP Waka Kurikulum
                  </label>
                  <input
                    type="text"
                    value={formData.nip_waka_kurikulum || ''}
                    onChange={(e) => handleChange('nip_waka_kurikulum', e.target.value)}
                    placeholder="19850612 201001 1 012"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun Ajaran Aktif
                  </label>
                  <input
                    type="text"
                    value={formData.tahun_ajaran}
                    onChange={(e) => handleChange('tahun_ajaran', e.target.value)}
                    placeholder="2026/2027"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-emerald-500 bg-slate-50/50 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => handleChange('semester', e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-emerald-500 bg-slate-50/50"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Profil</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Kop Surat & Kartu Identitas */}
          <div className="lg:col-span-5 space-y-6">
            {/* Kartu Sidebar Preview */}
            <div className="bg-[#0b1322] rounded-3xl p-5 border border-slate-800 shadow-xl text-white">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pratinjau Header Sidebar Kiri</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-sm tracking-tight text-white truncate">
                      SIM-JADWAL SEKOLAH
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-extrabold text-[10px]">
                      {formData.jenjang || 'MA/SMA'}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-emerald-400 truncate mt-0.5">
                    {formData.nama_sekolah || 'NAMA SEKOLAH'}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Preview Kop Surat PDF */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pratinjau Kop Surat Resmi Cetak PDF</span>
              </div>

              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-center font-serif text-slate-900 shadow-2xs">
                <div className="text-[11px] uppercase font-black tracking-widest text-slate-800 leading-tight">
                  {formData.instansi_pemerintah || 'PEMERINTAH ACEH'}
                </div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-700 leading-tight">
                  {formData.dinas_pendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                </div>
                {formData.cabang_dinas && (
                  <div className="text-[9px] uppercase font-bold tracking-wide text-slate-600 leading-tight">
                    {formData.cabang_dinas}
                  </div>
                )}
                <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 mt-1">
                  {formData.nama_sekolah || 'SMA 1 BANDA ACEH'}
                </h4>
                <p className="text-[9.5px] text-slate-600 font-sans mt-0.5">
                  {formData.alamat_sekolah || 'Jl. Syiah Kuala No. 1, Banda Aceh'}
                  {formData.telepon ? ` | Telp. ${formData.telepon}` : ''}
                  {formData.email_sekolah ? ` | ${formData.email_sekolah}` : ''}
                </p>
                <div className="border-b-2 border-double border-slate-900 my-2" />
                <div className="text-[10px] font-bold font-sans text-slate-800">
                  JADWAL PELAJARAN SEMESTER {formData.semester.toUpperCase()} TAHUN AJARAN {formData.tahun_ajaran}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-sans space-y-2">
                <div className="font-bold text-slate-800 text-[11px]">Penandatangan Dokumen:</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Kepala Sekolah:</span>
                  <span className="font-semibold text-slate-800">{formData.nama_kepsek}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">NIP Kepala Sekolah:</span>
                  <span className="font-mono text-slate-700">{formData.nip_kepsek || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Waka Kurikulum:</span>
                  <span className="font-semibold text-slate-800">{formData.nama_waka_kurikulum || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Titi Mangsa:</span>
                  <span className="font-medium text-slate-700">
                    {formData.kota_titi_mangsa || 'Kota'}, 31 Oktober 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Struktur Waktu Sesi (Jam KBM) */
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Jam Pelajaran & Jam Istirahat per Hari</span>
              </h3>
              <p className="text-xs text-slate-500">
                Tentukan durasi KBM, jam istirahat sholat, upacara, dan sesi pulang untuk hari aktif
              </p>
            </div>

            {/* Filter Hari */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {days.map((hari) => (
                <button
                  key={hari}
                  type="button"
                  onClick={() => setSelectedHari(hari)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedHari === hari
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {hari}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2.5 px-3">Sesi</th>
                  <th className="py-2.5 px-3">Jam Mulai</th>
                  <th className="py-2.5 px-3">Jam Selesai</th>
                  <th className="py-2.5 px-3">Tipe Sesi</th>
                  <th className="py-2.5 px-3">Label / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waktuHariIni.map((w) => (
                  <tr
                    key={w.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      w.is_istirahat ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      Jam ke-{w.sesi_ke}
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="time"
                        value={w.jam_mulai}
                        onChange={(e) =>
                          handleUpdateTimeSlot(w.id, 'jam_mulai', e.target.value)
                        }
                        className="px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="time"
                        value={w.jam_selesai}
                        onChange={(e) =>
                          handleUpdateTimeSlot(w.id, 'jam_selesai', e.target.value)
                        }
                        className="px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={w.is_istirahat ? 'istirahat' : 'belajar'}
                        onChange={(e) => {
                          const isIstirahat = e.target.value === 'istirahat';
                          handleUpdateTimeSlot(w.id, 'is_istirahat', isIstirahat);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          w.is_istirahat
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <option value="belajar">Jam Pelajaran (KBM)</option>
                        <option value="istirahat">Istirahat / Sholat / Upacara</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={w.label || ''}
                        onChange={(e) =>
                          handleUpdateTimeSlot(w.id, 'label', e.target.value)
                        }
                        placeholder={w.is_istirahat ? 'Contoh: Istirahat / Sholat Dhuhur' : 'KBM Normal'}
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium text-slate-800"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
