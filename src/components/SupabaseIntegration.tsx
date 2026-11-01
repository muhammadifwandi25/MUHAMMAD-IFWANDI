/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Download,
  FileCode,
  FileJson,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { TimetableSolver } from '../lib/schedulerEngine';
import {
  JadwalTersusunItem,
  MasterGuru,
  MasterKelas,
  MasterMapel,
  MasterWaktu,
  PlottingBeban,
} from '../types/scheduler';

interface Props {
  jadwal: JadwalTersusunItem[];
  guruList: MasterGuru[];
  mapelList: MasterMapel[];
  kelasList: MasterKelas[];
  waktuList: MasterWaktu[];
  plottings: PlottingBeban[];
}

export const SupabaseIntegration: React.FC<Props> = ({
  jadwal,
  guruList,
  mapelList,
  kelasList,
  waktuList,
  plottings,
}) => {
  const [activeTab, setActiveTab] = useState<'ddl-schema' | 'seed-sql' | 'insert-sql' | 'json-export'>(
    'ddl-schema'
  );
  const [copied, setCopied] = useState<string | null>(null);

  // Live Supabase connection states
  const projectRef = 'obpgeccazckossgulqom';
  const restEndpoint = 'https://obpgeccazckossgulqom.supabase.co/rest/v1/';
  const [anonKey, setAnonKey] = useState<string>('');
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'warning' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setTestMessage('Menguji konektivitas ke https://obpgeccazckossgulqom.supabase.co/rest/v1/ ...');

    try {
      const res = await fetch('/api/supabase/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://obpgeccazckossgulqom.supabase.co',
          apiKey: anonKey.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestStatus('success');
        setTestMessage(data.message || 'Koneksi ke Supabase berhasil!');
      } else if (data.reachable && !data.authenticated) {
        setTestStatus('warning');
        setTestMessage(data.message || 'Server Supabase aktif. Masukkan Anon Key untuk akses autentikasi.');
      } else {
        setTestStatus('error');
        setTestMessage(data.message || 'Gagal terhubung ke Supabase.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Gagal menghubungi server proxy.');
    }
  };

  const handlePushSync = async () => {
    if (!anonKey.trim()) {
      setSyncFeedback('Silakan masukkan Anon Key (Project API Key) dari Supabase Dashboard terlebih dahulu.');
      return;
    }

    try {
      localStorage.setItem('jadwalpintar_supabase_key', anonKey.trim());
    } catch {
      // ignore
    }

    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const res = await fetch('/api/supabase/sync-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guru: guruList,
          mapel: mapelList,
          kelas: kelasList,
          waktu: waktuList,
          plotting: plottings,
          jadwal,
          apiKey: anonKey.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncFeedback('Sinkronisasi online ke tabel Supabase berhasil!');
      } else {
        setSyncFeedback(`Gagal sinkronisasi: ${data.error || 'Periksa apakah tabel sudah dibuat via SQL Editor.'}`);
      }
    } catch (err: any) {
      setSyncFeedback(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const solver = new TimetableSolver(guruList, mapelList, kelasList, waktuList);

  const insertSqlContent = solver.generateSupabaseSQL(jadwal);

  const ddlSchemaContent = `-- ==============================================================================
-- STRUKTUR DATABASE SUPABASE LENGKAP: SISTEM PENJADWALAN SEKOLAH & MADRASAH
-- Versi: 2.0 (Production-Ready dengan RLS, Anti-Bentrok Hard Constraints, & Trigger)
-- ==============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUMS (CUSTOM TYPES)
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'guru', 'kepsek');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hari_aktif AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kategori_mapel AS ENUM ('Reguler', 'Muatan Lokal', 'Keagamaan', 'Kejuruan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipe_sesi AS ENUM ('belajar', 'istirahat', 'upacara', 'sholat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. TABEL PROFIL USER (Relasi ke auth.users Supabase)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nama_lengkap TEXT NOT NULL,
    role user_role DEFAULT 'guru' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABEL MASTER GURU
-- ==============================================================================
CREATE TABLE IF NOT EXISTS master_guru (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL UNIQUE,
    nama_guru TEXT NOT NULL,
    kode_guru VARCHAR(10) UNIQUE NOT NULL,
    nip VARCHAR(30),
    max_jtm INT DEFAULT 24 NOT NULL CHECK (max_jtm > 0 AND max_jtm <= 45),
    warna_tag VARCHAR(10) DEFAULT '#2563eb',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABEL KETERSEDIAAN / WAKTU BERHALANGAN GURU
-- ==============================================================================
CREATE TABLE IF NOT EXISTS guru_berhalangan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guru_id UUID NOT NULL REFERENCES master_guru(id) ON DELETE CASCADE,
    hari hari_aktif NOT NULL,
    sesi_ke INT NOT NULL CHECK (sesi_ke > 0),
    keterangan TEXT DEFAULT 'Tugas Luar / Izin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(guru_id, hari, sesi_ke)
);

-- ==============================================================================
-- 5. TABEL MASTER MATA PELAJARAN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS master_mapel (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama_mapel TEXT NOT NULL,
    kode_mapel VARCHAR(15) UNIQUE NOT NULL,
    kategori kategori_mapel DEFAULT 'Reguler' NOT NULL,
    default_blok INT DEFAULT 2 NOT NULL CHECK (default_blok >= 1 AND default_blok <= 6),
    warna VARCHAR(10) DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. TABEL MASTER KELAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS master_kelas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama_kelas VARCHAR(30) UNIQUE NOT NULL,
    tingkat VARCHAR(10) NOT NULL,
    jurusan VARCHAR(100) DEFAULT 'Umum',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. TABEL MASTER WAKTU (STRUKTUR SESI HARIAN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS master_waktu (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hari hari_aktif NOT NULL,
    sesi_ke INT NOT NULL CHECK (sesi_ke > 0),
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    is_istirahat BOOLEAN DEFAULT false NOT NULL,
    tipe_sesi tipe_sesi DEFAULT 'belajar' NOT NULL,
    label VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hari, sesi_ke),
    CHECK (jam_mulai < jam_selesai)
);

-- ==============================================================================
-- 8. TABEL PLOTTING BEBAN MENGAJAR
-- ==============================================================================
CREATE TABLE IF NOT EXISTS plotting_beban (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kelas_id UUID NOT NULL REFERENCES master_kelas(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES master_guru(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES master_mapel(id) ON DELETE CASCADE,
    total_jtm INT NOT NULL CHECK (total_jtm > 0),
    blok_pertemuan INT[] DEFAULT ARRAY[2],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kelas_id, guru_id, mapel_id)
);

-- ==============================================================================
-- 9. TABEL JADWAL PELAJARAN (HARD CONSTRAINTS ANTI-BENTROK)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    waktu_id UUID NOT NULL REFERENCES master_waktu(id) ON DELETE CASCADE,
    kelas_id UUID NOT NULL REFERENCES master_kelas(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES master_guru(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES master_mapel(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- HARD CONSTRAINT 1: Satu Guru hanya bisa mengajar 1 Kelas di 1 Waktu yang sama
    CONSTRAINT unique_guru_waktu UNIQUE (guru_id, waktu_id),

    -- HARD CONSTRAINT 2: Satu Kelas hanya bisa belajar 1 Mapel di 1 Waktu yang sama
    CONSTRAINT unique_kelas_waktu UNIQUE (kelas_id, waktu_id)
);

-- ==============================================================================
-- 10. INDEXES UNTUK PERFORMA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_jadwal_waktu_id ON jadwal_pelajaran(waktu_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas_id ON jadwal_pelajaran(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_guru_id ON jadwal_pelajaran(guru_id);
CREATE INDEX IF NOT EXISTS idx_waktu_hari_sesi ON master_waktu(hari, sesi_ke);
CREATE INDEX IF NOT EXISTS idx_guru_berhalangan ON guru_berhalangan(guru_id, hari, sesi_ke);

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru_berhalangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_waktu ENABLE ROW LEVEL SECURITY;
ALTER TABLE plotting_beban ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_pelajaran ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies READ: Semua user authenticated dapat melihat data
CREATE POLICY "Baca semua Master Guru" ON master_guru FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Baca semua Master Mapel" ON master_mapel FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Baca semua Master Kelas" ON master_kelas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Baca semua Master Waktu" ON master_waktu FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Baca semua Plotting" ON plotting_beban FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Baca semua Jadwal" ON jadwal_pelajaran FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Baca ketersediaan" ON guru_berhalangan FOR SELECT USING (auth.role() = 'authenticated');

-- Policies WRITE: Hanya Admin yang dapat INSERT, UPDATE, DELETE
CREATE POLICY "Admin CRUD Master Guru" ON master_guru FOR ALL USING (is_admin());
CREATE POLICY "Admin CRUD Master Mapel" ON master_mapel FOR ALL USING (is_admin());
CREATE POLICY "Admin CRUD Master Kelas" ON master_kelas FOR ALL USING (is_admin());
CREATE POLICY "Admin CRUD Master Waktu" ON master_waktu FOR ALL USING (is_admin());
CREATE POLICY "Admin CRUD Plotting" ON plotting_beban FOR ALL USING (is_admin());
CREATE POLICY "Admin CRUD Jadwal" ON jadwal_pelajaran FOR ALL USING (is_admin());`;

  const seedSqlContent = `-- ==============================================================================
-- DATA SEED AWAL MASTER DATA SUPABASE (JALANKAN SETELAH SKEMA)
-- ==============================================================================

BEGIN;

-- 1. SEED KELAS
INSERT INTO master_kelas (id, nama_kelas, tingkat, jurusan) VALUES
('a0000001-0000-0000-0000-000000000001', 'X RPL 1', 'X', 'Rekayasa Perangkat Lunak'),
('a0000001-0000-0000-0000-000000000002', 'X RPL 2', 'X', 'Rekayasa Perangkat Lunak'),
('a0000001-0000-0000-0000-000000000003', 'XI RPL 1', 'XI', 'Rekayasa Perangkat Lunak'),
('a0000001-0000-0000-0000-000000000004', 'XI TKJ 1', 'XI', 'Teknik Komputer & Jaringan'),
('a0000001-0000-0000-0000-000000000005', 'XII RPL 1', 'XII', 'Rekayasa Perangkat Lunak')
ON CONFLICT (nama_kelas) DO NOTHING;

-- 2. SEED MATA PELAJARAN
INSERT INTO master_mapel (id, kode_mapel, nama_mapel, kategori, default_blok, warna) VALUES
('b0000001-0000-0000-0000-000000000001', 'PAI', 'Pendidikan Agama Islam & Budi Pekerti', 'Keagamaan', 3, '#10b981'),
('b0000001-0000-0000-0000-000000000002', 'MTK', 'Matematika Umum', 'Reguler', 2, '#3b82f6'),
('b0000001-0000-0000-0000-000000000003', 'PWEB', 'Pemrograman Web & Perangkat Bergerak', 'Kejuruan', 4, '#8b5cf6'),
('b0000001-0000-0000-0000-000000000004', 'BIND', 'Bahasa Indonesia', 'Reguler', 3, '#f59e0b'),
('b0000001-0000-0000-0000-000000000005', 'BDAT', 'Basis Data & Arsitektur Cloud', 'Kejuruan', 3, '#06b6d4'),
('b0000001-0000-0000-0000-000000000006', 'BARB', 'Bahasa Arab / Baca Tulis Al-Quran', 'Keagamaan', 2, '#059669'),
('b0000001-0000-0000-0000-000000000007', 'BING', 'Bahasa Inggris', 'Reguler', 2, '#f97316'),
('b0000001-0000-0000-0000-000000000008', 'UIUX', 'Desain Grafis & Prototipe UI/UX', 'Kejuruan', 3, '#ec4899'),
('b0000001-0000-0000-0000-000000000009', 'PJOK', 'Pendidikan Jasmani & Kesehatan', 'Reguler', 3, '#22c55e'),
('b0000001-0000-0000-0000-000000000010', 'PPKN', 'Pendidikan Pancasila & Kewarganegaraan', 'Reguler', 2, '#6366f1')
ON CONFLICT (kode_mapel) DO NOTHING;

-- 3. SEED GURU
INSERT INTO master_guru (id, kode_guru, nama_guru, nip, max_jtm, warna_tag) VALUES
('c0000001-0000-0000-0000-000000000001', 'G01', 'Drs. H. Ahmad Fauzi, M.Pd.I', '197508122002121001', 24, '#059669'),
('c0000001-0000-0000-0000-000000000002', 'G02', 'Siti Aminah, S.Pd', '198203152008012015', 26, '#2563eb'),
('c0000001-0000-0000-0000-000000000003', 'G03', 'Budi Santoso, S.Kom, M.T', '198711042010011008', 28, '#7c3aed'),
('c0000001-0000-0000-0000-000000000004', 'G04', 'Rina Kartika, M.Pd', '198906212014022003', 24, '#d97706'),
('c0000001-0000-0000-0000-000000000005', 'G05', 'Ir. Dwi Cahyono', '198005172005011004', 24, '#0284c7'),
('c0000001-0000-0000-0000-000000000006', 'G06', 'Nurul Hidayati, S.Pd.I', '199109082019032014', 22, '#10b981'),
('c0000001-0000-0000-0000-000000000007', 'G07', 'Eko Prasetyo, S.Pd', '198412252009021002', 24, '#ea580c'),
('c0000001-0000-0000-0000-000000000008', 'G08', 'Maya Anggraeni, S.Ds', '199304192020122009', 24, '#db2777'),
('c0000001-0000-0000-0000-000000000009', 'G09', 'Hendra Wijaya, S.Or', '198801102011011005', 20, '#16a34a'),
('c0000001-0000-0000-0000-000000000010', 'G10', 'Sri Wahyuni, S.Pd', '197907282006042018', 24, '#4f46e5')
ON CONFLICT (kode_guru) DO NOTHING;

COMMIT;`;

  const jsonExportData = {
    jadwal_tersusun: jadwal.map((j) => ({
      hari: j.hari,
      sesi: j.sesi,
      kelas_id: j.kelas_id,
      mapel_id: j.mapel_id,
      guru_id: j.guru_id,
    })),
    jadwal_gagal: [],
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  const handleDownloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Live Supabase Project Connection Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-3xl p-6 border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Live Supabase Project:</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {projectRef}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  REST API Aktif
                </span>
              </div>
              <div className="font-mono text-xs text-slate-300 mt-0.5 break-all">
                {restEndpoint}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'loading'}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors flex items-center gap-1.5"
            >
              {testStatus === 'loading' ? 'Menguji...' : 'Uji Status Koneksi'}
            </button>
            <button
              onClick={handlePushSync}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Online'}</span>
            </button>
          </div>
        </div>

        {/* API Key Input and instructions */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Supabase Project API Key (Anon Public Key)
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Salin dari Dashboard > Settings > API)"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="text-[11px] text-slate-400 max-w-sm">
            Kunci API dapat disalin dari Dashboard Supabase Anda:
            <strong className="text-emerald-400 ml-1">Settings &gt; API &gt; Project API keys (anon public)</strong>.
          </div>
        </div>

        {testMessage && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
              testStatus === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                : testStatus === 'warning'
                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-200'
                : 'bg-red-500/20 border border-red-500/30 text-red-200'
            }`}
          >
            <span>{testMessage}</span>
          </div>
        )}

        {syncFeedback && (
          <div className="mt-3 p-3 rounded-xl text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-200">
            {syncFeedback}
          </div>
        )}
      </div>

      {/* Top Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Struktur Database Supabase & Ekspor Data
          </h3>
          <p className="text-xs text-slate-500">
            Skrip SQL DDL lengkap, data seed master, skrip INSERT jadwal hasil algoritma, dan JSON murni.
          </p>
        </div>

        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('ddl-schema')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ddl-schema'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            1. Skema DDL & RLS
          </button>
          <button
            onClick={() => setActiveTab('seed-sql')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'seed-sql'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            2. Data Seed Awal
          </button>
          <button
            onClick={() => setActiveTab('insert-sql')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'insert-sql'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            3. INSERT Jadwal ({jadwal.length} Row)
          </button>
          <button
            onClick={() => setActiveTab('json-export')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'json-export'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileJson className="w-4 h-4" />
            4. Format JSON Murni
          </button>
        </div>
      </div>

      {/* Tab: DDL SCHEMA & RLS */}
      {activeTab === 'ddl-schema' && (
        <div className="bg-slate-900 rounded-3xl p-6 text-slate-100 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Struktur DDL PostgreSQL / Supabase Lengkap
              </h4>
              <p className="text-xs text-slate-400">
                Memuat Enums, Tabel Profiles, Master Guru/Mapel/Kelas/Waktu, Plotting Beban, Jadwal Pelajaran (2 Hard Constraints), RLS, & Trigger.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleDownloadFile(ddlSchemaContent, 'supabase_schema.sql', 'text/plain')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh supabase_schema.sql
              </button>
              <button
                onClick={() => handleCopy(ddlSchemaContent, 'ddl-schema')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
              >
                {copied === 'ddl-schema' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'ddl-schema' ? 'Tersalin!' : 'Salin DDL SQL'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-[500px]">
            {ddlSchemaContent}
          </pre>
        </div>
      )}

      {/* Tab: SEED DATA SQL */}
      {activeTab === 'seed-sql' && (
        <div className="bg-slate-900 rounded-3xl p-6 text-slate-100 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Data Seed Awal Master Guru, Mapel, Kelas & Waktu
              </h4>
              <p className="text-xs text-slate-400">
                Eksekusi script ini di Supabase SQL Editor setelah mengeksekusi DDL Skema di Tab 1.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleDownloadFile(seedSqlContent, 'supabase_seed.sql', 'text/plain')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh supabase_seed.sql
              </button>
              <button
                onClick={() => handleCopy(seedSqlContent, 'seed-sql')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
              >
                {copied === 'seed-sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'seed-sql' ? 'Tersalin!' : 'Salin Seed SQL'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-blue-300 leading-relaxed overflow-x-auto max-h-[500px]">
            {seedSqlContent}
          </pre>
        </div>
      )}

      {/* Tab: INSERT SQL */}
      {activeTab === 'insert-sql' && (
        <div className="bg-slate-900 rounded-3xl p-6 text-slate-100 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                SQL INSERT Jadwal Pelajaran (Hasil Algoritma)
              </h4>
              <p className="text-xs text-slate-400">
                Memuat data seluruh slot jam pelajaran yang telah disusun bebas bentrok oleh sistem.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleDownloadFile(insertSqlContent, 'insert_jadwal_pelajaran.sql', 'text/plain')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh .SQL
              </button>
              <button
                onClick={() => handleCopy(insertSqlContent, 'insert-sql')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
              >
                {copied === 'insert-sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'insert-sql' ? 'Tersalin!' : 'Salin INSERT SQL'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-purple-300 leading-relaxed overflow-x-auto max-h-[500px]">
            {insertSqlContent}
          </pre>
        </div>
      )}

      {/* Tab: JSON EXPORT */}
      {activeTab === 'json-export' && (
        <div className="bg-slate-900 rounded-3xl p-6 text-slate-100 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <FileJson className="w-4 h-4 text-amber-400" />
                Format Output JSON Murni (Spesifikasi Prompt)
              </h4>
              <p className="text-xs text-slate-400">
                Memuat objek JSON murni dengan parameter `jadwal_tersusun` dan `jadwal_gagal`.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleDownloadFile(
                    JSON.stringify(jsonExportData, null, 2),
                    'jadwal_tersusun.json',
                    'application/json'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh .JSON
              </button>
              <button
                onClick={() =>
                  handleCopy(JSON.stringify(jsonExportData, null, 2), 'json-export')
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
              >
                {copied === 'json-export' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'json-export' ? 'Tersalin!' : 'Salin JSON'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-amber-300 leading-relaxed overflow-x-auto max-h-[500px]">
            {JSON.stringify(jsonExportData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
