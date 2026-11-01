-- ==============================================================================
-- STRUKTUR DATABASE SUPABASE LENGKAP: SISTEM PENJADWALAN SEKOLAH & MADRASAH
-- Versi: 2.0 (Production-Ready dengan RLS, Anti-Bentrok Hard Constraints, & Trigger)
-- ==============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUMS (CUSTOM TYPES)
-- ==============================================================================

-- Role Pengguna
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'guru', 'kepsek');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Hari Aktif Sekolah / Madrasah
DO $$ BEGIN
    CREATE TYPE hari_aktif AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Kategori Mata Pelajaran
DO $$ BEGIN
    CREATE TYPE kategori_mapel AS ENUM ('Reguler', 'Muatan Lokal', 'Keagamaan', 'Kejuruan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipe Sesi Waktu
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
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL UNIQUE, -- 1 akun = 1 guru (opsional)
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
-- 6. TABEL MASTER KELAS (ROMBONGAN BELAJAR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS master_kelas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama_kelas VARCHAR(30) UNIQUE NOT NULL,
    tingkat VARCHAR(10) NOT NULL, -- X, XI, XII atau 7, 8, 9
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
    label VARCHAR(100), -- Contoh: 'Upacara Bendera', 'Istirahat 1 (Dhuha)', 'Sholat Jumat'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hari, sesi_ke), -- Mencegah duplikasi slot waktu per hari
    CHECK (jam_mulai < jam_selesai)
);

-- ==============================================================================
-- 8. TABEL PLOTTING BEBAN MENGAJAR (INPUT BEBAN KERJA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS plotting_beban (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kelas_id UUID NOT NULL REFERENCES master_kelas(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES master_guru(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES master_mapel(id) ON DELETE CASCADE,
    total_jtm INT NOT NULL CHECK (total_jtm > 0),
    blok_pertemuan INT[] DEFAULT ARRAY[2], -- Pola blok pertemuan berurutan, misal: [2, 2] atau [3]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kelas_id, guru_id, mapel_id)
);

-- ==============================================================================
-- 9. TABEL JADWAL PELAJARAN (OUTPUT BEBAS BENTROK - HARD CONSTRAINTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    waktu_id UUID NOT NULL REFERENCES master_waktu(id) ON DELETE CASCADE,
    kelas_id UUID NOT NULL REFERENCES master_kelas(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES master_guru(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES master_mapel(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- HARD CONSTRAINT 1: Satu Guru hanya bisa mengajar 1 Kelas di 1 Waktu yang sama (Anti-Bentrok Guru)
    CONSTRAINT unique_guru_waktu UNIQUE (guru_id, waktu_id),

    -- HARD CONSTRAINT 2: Satu Kelas hanya bisa belajar 1 Mapel di 1 Waktu yang sama (Anti-Bentrok Kelas)
    CONSTRAINT unique_kelas_waktu UNIQUE (kelas_id, waktu_id)
);

-- ==============================================================================
-- 10. INDEXES UNTUK PERFORMA QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_jadwal_waktu_id ON jadwal_pelajaran(waktu_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas_id ON jadwal_pelajaran(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_guru_id ON jadwal_pelajaran(guru_id);
CREATE INDEX IF NOT EXISTS idx_waktu_hari_sesi ON master_waktu(hari, sesi_ke);
CREATE INDEX IF NOT EXISTS idx_guru_berhalangan ON guru_berhalangan(guru_id, hari, sesi_ke);
CREATE INDEX IF NOT EXISTS idx_plotting_kelas ON plotting_beban(kelas_id);
CREATE INDEX IF NOT EXISTS idx_plotting_guru ON plotting_beban(guru_id);

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

-- Helper Function: Cek apakah user aktif adalah admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Cek apakah user aktif adalah guru pemilik data
CREATE OR REPLACE FUNCTION is_owner_teacher(target_guru_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM master_guru
    WHERE id = target_guru_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES: PROFILES
DROP POLICY IF EXISTS "Semua user authenticated bisa melihat profil" ON profiles;
CREATE POLICY "Semua user authenticated bisa melihat profil" 
ON profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "User bisa update profil sendiri" ON profiles;
CREATE POLICY "User bisa update profil sendiri" 
ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin bisa mengelola semua profil" ON profiles;
CREATE POLICY "Admin bisa mengelola semua profil" 
ON profiles FOR ALL USING (is_admin());

-- POLICIES: READ ACCESS (Admin, Guru, Kepsek bisa melihat semua data jadwal & master)
DROP POLICY IF EXISTS "Baca master_guru" ON master_guru;
CREATE POLICY "Baca master_guru" ON master_guru FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Baca guru_berhalangan" ON guru_berhalangan;
CREATE POLICY "Baca guru_berhalangan" ON guru_berhalangan FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Baca master_mapel" ON master_mapel;
CREATE POLICY "Baca master_mapel" ON master_mapel FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Baca master_kelas" ON master_kelas;
CREATE POLICY "Baca master_kelas" ON master_kelas FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Baca master_waktu" ON master_waktu;
CREATE POLICY "Baca master_waktu" ON master_waktu FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Baca plotting_beban" ON plotting_beban;
CREATE POLICY "Baca plotting_beban" ON plotting_beban FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Baca jadwal_pelajaran" ON jadwal_pelajaran;
CREATE POLICY "Baca jadwal_pelajaran" ON jadwal_pelajaran FOR SELECT USING (auth.role() = 'authenticated');

-- POLICIES: WRITE ACCESS (Hanya Admin yang bisa CRUD Master Data & Jadwal)
DROP POLICY IF EXISTS "Admin CRUD master_guru" ON master_guru;
CREATE POLICY "Admin CRUD master_guru" ON master_guru FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin CRUD master_mapel" ON master_mapel;
CREATE POLICY "Admin CRUD master_mapel" ON master_mapel FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin CRUD master_kelas" ON master_kelas;
CREATE POLICY "Admin CRUD master_kelas" ON master_kelas FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin CRUD master_waktu" ON master_waktu;
CREATE POLICY "Admin CRUD master_waktu" ON master_waktu FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin CRUD plotting_beban" ON plotting_beban;
CREATE POLICY "Admin CRUD plotting_beban" ON plotting_beban FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin CRUD jadwal_pelajaran" ON jadwal_pelajaran;
CREATE POLICY "Admin CRUD jadwal_pelajaran" ON jadwal_pelajaran FOR ALL USING (is_admin());

-- Khusus Guru: Dapat mengatur ketersediaan waktu mereka sendiri
DROP POLICY IF EXISTS "Guru kelola ketersediaan sendiri" ON guru_berhalangan;
CREATE POLICY "Guru kelola ketersediaan sendiri" 
ON guru_berhalangan FOR ALL 
USING (is_admin() OR is_owner_teacher(guru_id));

-- ==============================================================================
-- 12. TRIGGER OTOMATIS: BUAT PROFIL SAAT USER BARU MENDAFTAR (AUTH.USERS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama_lengkap, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nama_lengkap', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'guru')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Selesai! Skema database siap digunakan langsung di Supabase SQL Editor.
