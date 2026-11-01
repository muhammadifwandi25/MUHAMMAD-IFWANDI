-- ==============================================================================
-- DATA SEED AWAL SUPABASE: SEKOLAH & MADRASAH
-- Jalankan setelah mengeksekusi supabase_schema.sql
-- ==============================================================================

BEGIN;

-- 1. SEED MASTER KELAS
INSERT INTO master_kelas (id, nama_kelas, tingkat, jurusan) VALUES
('a0000001-0000-0000-0000-000000000001', 'X RPL 1', 'X', 'Rekayasa Perangkat Lunak'),
('a0000001-0000-0000-0000-000000000002', 'X RPL 2', 'X', 'Rekayasa Perangkat Lunak'),
('a0000001-0000-0000-0000-000000000003', 'XI RPL 1', 'XI', 'Rekayasa Perangkat Lunak'),
('a0000001-0000-0000-0000-000000000004', 'XI TKJ 1', 'XI', 'Teknik Komputer & Jaringan'),
('a0000001-0000-0000-0000-000000000005', 'XII RPL 1', 'XII', 'Rekayasa Perangkat Lunak')
ON CONFLICT (nama_kelas) DO NOTHING;

-- 2. SEED MASTER MATA PELAJARAN
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

-- 3. SEED MASTER GURU
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

-- 4. SEED KETERSEDIAAN / BERHALANGAN GURU
INSERT INTO guru_berhalangan (guru_id, hari, sesi_ke, keterangan) VALUES
('c0000001-0000-0000-0000-000000000001', 'Jumat', 5, 'Persiapan Khutbah Jumat'),
('c0000001-0000-0000-0000-000000000001', 'Jumat', 6, 'Persiapan Khutbah Jumat'),
('c0000001-0000-0000-0000-000000000002', 'Rabu', 7, 'Dinas MGMP Matematika'),
('c0000001-0000-0000-0000-000000000002', 'Rabu', 8, 'Dinas MGMP Matematika'),
('c0000001-0000-0000-0000-000000000003', 'Kamis', 1, 'Pemeliharaan Server Lab'),
('c0000001-0000-0000-0000-000000000003', 'Kamis', 2, 'Pemeliharaan Server Lab')
ON CONFLICT (guru_id, hari, sesi_ke) DO NOTHING;

-- 5. SEED MASTER WAKTU (SENIN - JUMAT)
-- Senin
INSERT INTO master_waktu (hari, sesi_ke, jam_mulai, jam_selesai, is_istirahat, tipe_sesi, label) VALUES
('Senin', 1, '07:00', '07:45', true, 'upacara', 'Upacara Bendera'),
('Senin', 2, '07:45', '08:30', false, 'belajar', 'Jam ke-2'),
('Senin', 3, '08:30', '09:15', false, 'belajar', 'Jam ke-3'),
('Senin', 4, '09:15', '09:35', true, 'istirahat', 'Istirahat 1 (Dhuha)'),
('Senin', 5, '09:35', '10:20', false, 'belajar', 'Jam ke-5'),
('Senin', 6, '10:20', '11:05', false, 'belajar', 'Jam ke-6'),
('Senin', 7, '11:05', '11:50', false, 'belajar', 'Jam ke-7'),
('Senin', 8, '11:50', '12:30', true, 'sholat', 'Istirahat 2 (Dzuhur Jamaah)'),
('Senin', 9, '12:30', '13:15', false, 'belajar', 'Jam ke-9'),
('Senin', 10, '13:15', '14:00', false, 'belajar', 'Jam ke-10'),
('Senin', 11, '14:00', '14:45', false, 'belajar', 'Jam ke-11')
ON CONFLICT (hari, sesi_ke) DO NOTHING;

-- Selasa s.d. Kamis
INSERT INTO master_waktu (hari, sesi_ke, jam_mulai, jam_selesai, is_istirahat, tipe_sesi, label)
SELECT d.h, s.sesi, s.mulai::time, s.selesai::time, s.istirahat, s.tipe::tipe_sesi, s.lbl
FROM (VALUES ('Selasa'::hari_aktif), ('Rabu'::hari_aktif), ('Kamis'::hari_aktif)) AS d(h)
CROSS JOIN (VALUES 
  (1, '07:00', '07:45', false, 'belajar', 'Jam ke-1'),
  (2, '07:45', '08:30', false, 'belajar', 'Jam ke-2'),
  (3, '08:30', '09:15', false, 'belajar', 'Jam ke-3'),
  (4, '09:15', '09:35', true, 'istirahat', 'Istirahat 1 (Dhuha)'),
  (5, '09:35', '10:20', false, 'belajar', 'Jam ke-5'),
  (6, '10:20', '11:05', false, 'belajar', 'Jam ke-6'),
  (7, '11:05', '11:50', false, 'belajar', 'Jam ke-7'),
  (8, '11:50', '12:30', true, 'sholat', 'Istirahat 2 (Dzuhur Jamaah)'),
  (9, '12:30', '13:15', false, 'belajar', 'Jam ke-9'),
  (10, '13:15', '14:00', false, 'belajar', 'Jam ke-10'),
  (11, '14:00', '14:45', false, 'belajar', 'Jam ke-11')
) AS s(sesi, mulai, selesai, istirahat, tipe, lbl)
ON CONFLICT (hari, sesi_ke) DO NOTHING;

-- Jumat
INSERT INTO master_waktu (hari, sesi_ke, jam_mulai, jam_selesai, is_istirahat, tipe_sesi, label) VALUES
('Jumat', 1, '07:00', '07:45', false, 'belajar', 'Jam ke-1'),
('Jumat', 2, '07:45', '08:30', false, 'belajar', 'Jam ke-2'),
('Jumat', 3, '08:30', '09:15', false, 'belajar', 'Jam ke-3'),
('Jumat', 4, '09:15', '09:35', true, 'istirahat', 'Istirahat (Kudapan)'),
('Jumat', 5, '09:35', '10:20', false, 'belajar', 'Jam ke-5'),
('Jumat', 6, '10:20', '11:05', false, 'belajar', 'Jam ke-6'),
('Jumat', 7, '11:05', '12:45', true, 'sholat', 'Sholat Jumat Berjamaah')
ON CONFLICT (hari, sesi_ke) DO NOTHING;

COMMIT;

-- Selesai! Data master awal berhasil dimuat ke Supabase.
