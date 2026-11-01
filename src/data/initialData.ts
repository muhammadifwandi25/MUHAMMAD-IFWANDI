/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HariAktif,
  JadwalPiketItem,
  MasterGuru,
  MasterKelas,
  MasterMapel,
  MasterWaktu,
  PlottingBeban,
  SchoolProfile,
  UserProfile,
} from '../types/scheduler';

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  nama_sekolah: 'SMA 1 BANDA ACEH',
  instansi_pemerintah: 'PEMERINTAH ACEH',
  dinas_pendidikan: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  cabang_dinas: 'CABANG DINAS WILAYAH KOTA BANDA ACEH',
  nama_kepsek: 'Drs. H. Syarifuddin, M.Pd.',
  nip_kepsek: '19700101 199503 1 001',
  alamat_sekolah: 'Jl. Syiah Kuala No. 1, Bandar Baru, Kuta Alam, Kota Banda Aceh',
  jenjang: 'MA/SMA',
  telepon: '(0651) 22345',
  email_sekolah: 'info@sman1bandaaceh.sch.id',
  kota_titi_mangsa: 'Banda Aceh',
  nama_waka_kurikulum: 'Muhammad Ifwandi, S.Pd., M.Pd.',
  nip_waka_kurikulum: '19850612 201001 1 012',
  tahun_ajaran: '2026/2027',
  semester: 'Ganjil',
};

export const INITIAL_PIKET: JadwalPiketItem[] = [
  { id: 'pkt-1', hari: 'Senin', guru_id: 'g-001-fauzi', tugas: 'Piket Gerbang & Kedisiplinan Pagi', lokasi: 'Pintu Gerbang Utama' },
  { id: 'pkt-2', hari: 'Senin', guru_id: 'g-002-aminah', tugas: 'Piket KBM & Monitoring Jam Kosong', lokasi: 'Ruang Piket Lantai 1' },
  { id: 'pkt-3', hari: 'Selasa', guru_id: 'g-003-budi', tugas: 'Piket Kedisiplinan & Buku Tamu', lokasi: 'Lobi Utama' },
  { id: 'pkt-4', hari: 'Selasa', guru_id: 'g-004-dewi', tugas: 'Piket KBM & Absensi Siswa', lokasi: 'Ruang Piket' },
  { id: 'pkt-5', hari: 'Rabu', guru_id: 'g-005-eko', tugas: 'Piket Gerbang & Kerapian Siswa', lokasi: 'Pintu Gerbang' },
  { id: 'pkt-6', hari: 'Rabu', guru_id: 'g-006-fitri', tugas: 'Piket KBM & Penanganan Izin Keluar', lokasi: 'Ruang Piket' },
  { id: 'pkt-7', hari: 'Kamis', guru_id: 'g-007-gunawan', tugas: 'Piket Monitoring Lingkungan & Sholat Dhuhur', lokasi: 'Musholla' },
  { id: 'pkt-8', hari: 'Kamis', guru_id: 'g-008-hastuti', tugas: 'Piket KBM & Layanan Tamu', lokasi: 'Ruang Piket' },
  { id: 'pkt-9', hari: 'Jumat', guru_id: 'g-009-irwan', tugas: 'Piket Sholat Jumat & Kebersihan', lokasi: 'Masjid Sekolah' },
  { id: 'pkt-10', hari: 'Jumat', guru_id: 'g-010-joko', tugas: 'Piket KBM & Senam Pagi', lokasi: 'Lapangan Utama' },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u-001-admin',
    email: 'muhammadifwandi25@admin.smk.belajar.id',
    password: 'admin',
    nama_lengkap: 'Muhammad Ifwandi, S.Pd., M.Pd',
    role: 'admin',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'u-001-superadmin',
    email: 'admin@smk.belajar.id',
    password: 'admin',
    nama_lengkap: 'Super Admin Kurikulum',
    role: 'admin',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'u-002-kepsek',
    email: 'ifwandispd@gmail.com',
    password: 'admin',
    nama_lengkap: 'Muhammad Ifwandi, S.Pd., M.Pd',
    role: 'kepsek',
    created_at: '2026-01-12T08:00:00Z',
  },
  {
    id: 'u-003-fauzi',
    email: 'guru@smk.belajar.id',
    password: 'guru',
    nama_lengkap: 'Drs. H. Ahmad Fauzi, M.Pd.I',
    role: 'guru',
    guru_id: 'g-001-fauzi',
    created_at: '2026-01-15T08:00:00Z',
  },
];

export const INITIAL_GURU: MasterGuru[] = [
  {
    id: 'g-001-fauzi',
    kode_guru: 'G01',
    nama_guru: 'Drs. H. Ahmad Fauzi, M.Pd.I',
    max_jtm: 24,
    nip: '197508122002121001',
    warna_tag: '#059669', // Emerald
    berhalangan: [
      { hari: 'Jumat', sesi: [5, 6], keterangan: 'Persiapan Khutbah Jumat' },
      { hari: 'Senin', sesi: [1], keterangan: 'Rapat Pimpinan' },
    ],
  },
  {
    id: 'g-002-aminah',
    kode_guru: 'G02',
    nama_guru: 'Siti Aminah, S.Pd',
    max_jtm: 26,
    nip: '198203152008012015',
    warna_tag: '#2563eb', // Blue
    berhalangan: [
      { hari: 'Rabu', sesi: [7, 8], keterangan: 'Dinas MGMP Matematika' },
    ],
  },
  {
    id: 'g-003-budi',
    kode_guru: 'G03',
    nama_guru: 'Budi Santoso, S.Kom, M.T',
    max_jtm: 28,
    nip: '198711042010011008',
    warna_tag: '#7c3aed', // Purple
    berhalangan: [
      { hari: 'Kamis', sesi: [1, 2], keterangan: 'Pemeliharaan Server Lab' },
    ],
  },
  {
    id: 'g-004-rina',
    kode_guru: 'G04',
    nama_guru: 'Rina Kartika, M.Pd',
    max_jtm: 24,
    nip: '198906212014022003',
    warna_tag: '#d97706', // Amber
    berhalangan: [],
  },
  {
    id: 'g-005-dwi',
    kode_guru: 'G05',
    nama_guru: 'Ir. Dwi Cahyono',
    max_jtm: 24,
    nip: '198005172005011004',
    warna_tag: '#0284c7', // Sky
    berhalangan: [
      { hari: 'Selasa', sesi: [8, 9], keterangan: 'Bimbingan LKS IT' },
    ],
  },
  {
    id: 'g-006-nurul',
    kode_guru: 'G06',
    nama_guru: 'Nurul Hidayati, S.Pd.I',
    max_jtm: 22,
    nip: '199109082019032014',
    warna_tag: '#10b981', // Teal
    berhalangan: [
      { hari: 'Senin', sesi: [8, 9], keterangan: 'Tahfidz Ekstrakurikuler' },
    ],
  },
  {
    id: 'g-007-eko',
    kode_guru: 'G07',
    nama_guru: 'Eko Prasetyo, S.Pd',
    max_jtm: 24,
    nip: '198412252009021002',
    warna_tag: '#ea580c', // Orange
    berhalangan: [],
  },
  {
    id: 'g-008-maya',
    kode_guru: 'G08',
    nama_guru: 'Maya Anggraeni, S.Ds',
    max_jtm: 24,
    nip: '199304192020122009',
    warna_tag: '#db2777', // Pink
    berhalangan: [
      { hari: 'Jumat', sesi: [1, 2], keterangan: 'Pengembangan Bahan Ajar' },
    ],
  },
  {
    id: 'g-009-hendra',
    kode_guru: 'G09',
    nama_guru: 'Hendra Wijaya, S.Or',
    max_jtm: 20,
    nip: '198801102011011005',
    warna_tag: '#16a34a', // Green
    berhalangan: [
      { hari: 'Kamis', sesi: [7, 8, 9], keterangan: 'Pelatda Olahraga' },
    ],
  },
  {
    id: 'g-010-sri',
    kode_guru: 'G10',
    nama_guru: 'Sri Wahyuni, S.Pd',
    max_jtm: 24,
    nip: '197907282006042018',
    warna_tag: '#4f46e5', // Indigo
    berhalangan: [],
  },
];

export const INITIAL_MAPEL: MasterMapel[] = [
  {
    id: 'm-001-pai',
    kode_mapel: 'PAI',
    nama_mapel: 'Pendidikan Agama Islam & Budi Pekerti',
    kategori: 'Keagamaan',
    warna: '#10b981',
    default_blok: 3,
  },
  {
    id: 'm-002-mtk',
    kode_mapel: 'MTK',
    nama_mapel: 'Matematika Umum',
    kategori: 'Reguler',
    warna: '#3b82f6',
    default_blok: 2,
  },
  {
    id: 'm-003-pweb',
    kode_mapel: 'PWEB',
    nama_mapel: 'Pemrograman Web & Perangkat Bergerak',
    kategori: 'Kejuruan',
    warna: '#8b5cf6',
    default_blok: 4,
  },
  {
    id: 'm-004-bind',
    kode_mapel: 'BIND',
    nama_mapel: 'Bahasa Indonesia',
    kategori: 'Reguler',
    warna: '#f59e0b',
    default_blok: 3,
  },
  {
    id: 'm-005-db',
    kode_mapel: 'BDAT',
    nama_mapel: 'Basis Data & Arsitektur Cloud',
    kategori: 'Kejuruan',
    warna: '#06b6d4',
    default_blok: 3,
  },
  {
    id: 'm-006-barab',
    kode_mapel: 'BARB',
    nama_mapel: 'Bahasa Arab / Baca Tulis Al-Qur\'an',
    kategori: 'Keagamaan',
    warna: '#059669',
    default_blok: 2,
  },
  {
    id: 'm-007-bing',
    kode_mapel: 'BING',
    nama_mapel: 'Bahasa Inggris',
    kategori: 'Reguler',
    warna: '#f97316',
    default_blok: 2,
  },
  {
    id: 'm-008-uiux',
    kode_mapel: 'UIUX',
    nama_mapel: 'Desain Grafis & Prototipe UI/UX',
    kategori: 'Kejuruan',
    warna: '#ec4899',
    default_blok: 3,
  },
  {
    id: 'm-009-pjok',
    kode_mapel: 'PJOK',
    nama_mapel: 'Pendidikan Jasmani, Olahraga & Kesehatan',
    kategori: 'Reguler',
    warna: '#22c55e',
    default_blok: 3,
  },
  {
    id: 'm-010-ppkn',
    kode_mapel: 'PPKN',
    nama_mapel: 'Pendidikan Pancasila & Kewarganegaraan',
    kategori: 'Reguler',
    warna: '#6366f1',
    default_blok: 2,
  },
];

export const INITIAL_KELAS: MasterKelas[] = [
  {
    id: 'k-001-x-rpl1',
    nama_kelas: 'X RPL 1',
    tingkat: 'X',
    jurusan: 'Rekayasa Perangkat Lunak',
  },
  {
    id: 'k-002-x-rpl2',
    nama_kelas: 'X RPL 2',
    tingkat: 'X',
    jurusan: 'Rekayasa Perangkat Lunak',
  },
  {
    id: 'k-003-xi-rpl1',
    nama_kelas: 'XI RPL 1',
    tingkat: 'XI',
    jurusan: 'Rekayasa Perangkat Lunak',
  },
  {
    id: 'k-004-xi-tkj1',
    nama_kelas: 'XI TKJ 1',
    tingkat: 'XI',
    jurusan: 'Teknik Komputer & Jaringan',
  },
  {
    id: 'k-005-xii-rpl1',
    nama_kelas: 'XII RPL 1',
    tingkat: 'XII',
    jurusan: 'Rekayasa Perangkat Lunak',
  },
];

// Struktur Waktu Sekolah / Madrasah
// Senin-Kamis: Sesi 1 s.d. 9 (07:00 - 15:15)
// Jumat: Sesi 1 s.d. 6 (07:00 - 11:30 & Sholat Jumat)
export function generateDefaultWaktu(): MasterWaktu[] {
  const list: MasterWaktu[] = [];
  const days: HariAktif[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  const normalSchedule: {
    sesi: number;
    mulai: string;
    selesai: string;
    istirahat: boolean;
    tipe: import('../types/scheduler').TipeSesi;
    label: string;
  }[] = [
    { sesi: 1, mulai: '07:00', selesai: '07:45', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 2, mulai: '07:45', selesai: '08:30', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 3, mulai: '08:30', selesai: '09:15', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 4, mulai: '09:15', selesai: '09:35', istirahat: true, tipe: 'istirahat', label: 'Istirahat 1 (Dhuha)' },
    { sesi: 5, mulai: '09:35', selesai: '10:20', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 6, mulai: '10:20', selesai: '11:05', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 7, mulai: '11:05', selesai: '11:50', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 8, mulai: '11:50', selesai: '12:30', istirahat: true, tipe: 'sholat', label: 'Istirahat 2 (Dzuhur Jamaah)' },
    { sesi: 9, mulai: '12:30', selesai: '13:15', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 10, mulai: '13:15', selesai: '14:00', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 11, mulai: '14:00', selesai: '14:45', istirahat: false, tipe: 'belajar', label: '' },
  ];

  const jumatSchedule: {
    sesi: number;
    mulai: string;
    selesai: string;
    istirahat: boolean;
    tipe: import('../types/scheduler').TipeSesi;
    label: string;
  }[] = [
    { sesi: 1, mulai: '07:00', selesai: '07:45', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 2, mulai: '07:45', selesai: '08:30', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 3, mulai: '08:30', selesai: '09:15', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 4, mulai: '09:15', selesai: '09:35', istirahat: true, tipe: 'istirahat', label: 'Istirahat (Kudapan)' },
    { sesi: 5, mulai: '09:35', selesai: '10:20', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 6, mulai: '10:20', selesai: '11:05', istirahat: false, tipe: 'belajar', label: '' },
    { sesi: 7, mulai: '11:05', selesai: '12:45', istirahat: true, tipe: 'sholat', label: 'Sholat Jumat Berjamaah' },
  ];

  days.forEach((hari) => {
    const slots = hari === 'Jumat' ? jumatSchedule : normalSchedule;
    slots.forEach((s) => {
      let label = s.label;
      let tipe = s.tipe;
      let isIstirahat = s.istirahat;

      // Khusus Senin sesi 1 adalah Upacara Bendera
      if (hari === 'Senin' && s.sesi === 1) {
        label = 'Upacara Bendera';
        tipe = 'upacara';
        isIstirahat = true;
      }

      list.push({
        id: `waktu-${hari.toLowerCase()}-sesi-${s.sesi}`,
        hari,
        sesi_ke: s.sesi,
        jam_mulai: s.mulai,
        jam_selesai: s.selesai,
        is_istirahat: isIstirahat,
        tipe_sesi: tipe,
        label: label || `Jam ke-${s.sesi}`,
      });
    });
  });

  return list;
}

export const INITIAL_WAKTU = generateDefaultWaktu();

// Plotting Beban Mengajar Per Kelas
export const INITIAL_PLOTTING: PlottingBeban[] = [
  // Kelas X RPL 1 (Total target JTM: ~30 jam)
  { id: 'p-01', kelas_id: 'k-001-x-rpl1', guru_id: 'g-001-fauzi', mapel_id: 'm-001-pai', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-02', kelas_id: 'k-001-x-rpl1', guru_id: 'g-002-aminah', mapel_id: 'm-002-mtk', total_jtm: 4, blok_pertemuan: [2, 2] },
  { id: 'p-03', kelas_id: 'k-001-x-rpl1', guru_id: 'g-003-budi', mapel_id: 'm-003-pweb', total_jtm: 4, blok_pertemuan: [4] },
  { id: 'p-04', kelas_id: 'k-001-x-rpl1', guru_id: 'g-004-rina', mapel_id: 'm-004-bind', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-05', kelas_id: 'k-001-x-rpl1', guru_id: 'g-005-dwi', mapel_id: 'm-005-db', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-06', kelas_id: 'k-001-x-rpl1', guru_id: 'g-006-nurul', mapel_id: 'm-006-barab', total_jtm: 2, blok_pertemuan: [2] },
  { id: 'p-07', kelas_id: 'k-001-x-rpl1', guru_id: 'g-007-eko', mapel_id: 'm-007-bing', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-08', kelas_id: 'k-001-x-rpl1', guru_id: 'g-008-maya', mapel_id: 'm-008-uiux', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-09', kelas_id: 'k-001-x-rpl1', guru_id: 'g-009-hendra', mapel_id: 'm-009-pjok', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-10', kelas_id: 'k-001-x-rpl1', guru_id: 'g-010-sri', mapel_id: 'm-010-ppkn', total_jtm: 2, blok_pertemuan: [2] },

  // Kelas X RPL 2
  { id: 'p-11', kelas_id: 'k-002-x-rpl2', guru_id: 'g-001-fauzi', mapel_id: 'm-001-pai', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-12', kelas_id: 'k-002-x-rpl2', guru_id: 'g-002-aminah', mapel_id: 'm-002-mtk', total_jtm: 4, blok_pertemuan: [2, 2] },
  { id: 'p-13', kelas_id: 'k-002-x-rpl2', guru_id: 'g-003-budi', mapel_id: 'm-003-pweb', total_jtm: 4, blok_pertemuan: [4] },
  { id: 'p-14', kelas_id: 'k-002-x-rpl2', guru_id: 'g-004-rina', mapel_id: 'm-004-bind', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-15', kelas_id: 'k-002-x-rpl2', guru_id: 'g-005-dwi', mapel_id: 'm-005-db', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-16', kelas_id: 'k-002-x-rpl2', guru_id: 'g-006-nurul', mapel_id: 'm-006-barab', total_jtm: 2, blok_pertemuan: [2] },
  { id: 'p-17', kelas_id: 'k-002-x-rpl2', guru_id: 'g-007-eko', mapel_id: 'm-007-bing', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-18', kelas_id: 'k-002-x-rpl2', guru_id: 'g-008-maya', mapel_id: 'm-008-uiux', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-19', kelas_id: 'k-002-x-rpl2', guru_id: 'g-009-hendra', mapel_id: 'm-009-pjok', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-20', kelas_id: 'k-002-x-rpl2', guru_id: 'g-010-sri', mapel_id: 'm-010-ppkn', total_jtm: 2, blok_pertemuan: [2] },

  // Kelas XI RPL 1
  { id: 'p-21', kelas_id: 'k-003-xi-rpl1', guru_id: 'g-001-fauzi', mapel_id: 'm-001-pai', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-22', kelas_id: 'k-003-xi-rpl1', guru_id: 'g-002-aminah', mapel_id: 'm-002-mtk', total_jtm: 4, blok_pertemuan: [2, 2] },
  { id: 'p-23', kelas_id: 'k-003-xi-rpl1', guru_id: 'g-003-budi', mapel_id: 'm-003-pweb', total_jtm: 4, blok_pertemuan: [4] },
  { id: 'p-24', kelas_id: 'k-003-xi-rpl1', guru_id: 'g-004-rina', mapel_id: 'm-004-bind', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-25', kelas_id: 'k-003-xi-rpl1', guru_id: 'g-005-dwi', mapel_id: 'm-005-db', total_jtm: 4, blok_pertemuan: [4] },
  { id: 'p-26', kelas_id: 'k-003-xi-rpl1', guru_id: 'g-007-eko', mapel_id: 'm-007-bing', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-27', kelas_id: 'k-003-xi-rpl1', guru_id: 'g-008-maya', mapel_id: 'm-008-uiux', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-28', kelas_id: 'k-003-xi-rpl1', guru_id: 'g-010-sri', mapel_id: 'm-010-ppkn', total_jtm: 2, blok_pertemuan: [2] },

  // Kelas XI TKJ 1
  { id: 'p-29', kelas_id: 'k-004-xi-tkj1', guru_id: 'g-001-fauzi', mapel_id: 'm-001-pai', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-30', kelas_id: 'k-004-xi-tkj1', guru_id: 'g-002-aminah', mapel_id: 'm-002-mtk', total_jtm: 4, blok_pertemuan: [2, 2] },
  { id: 'p-31', kelas_id: 'k-004-xi-tkj1', guru_id: 'g-004-rina', mapel_id: 'm-004-bind', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-32', kelas_id: 'k-004-xi-tkj1', guru_id: 'g-005-dwi', mapel_id: 'm-005-db', total_jtm: 4, blok_pertemuan: [4] },
  { id: 'p-33', kelas_id: 'k-004-xi-tkj1', guru_id: 'g-007-eko', mapel_id: 'm-007-bing', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-34', kelas_id: 'k-004-xi-tkj1', guru_id: 'g-009-hendra', mapel_id: 'm-009-pjok', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-35', kelas_id: 'k-004-xi-tkj1', guru_id: 'g-010-sri', mapel_id: 'm-010-ppkn', total_jtm: 2, blok_pertemuan: [2] },

  // Kelas XII RPL 1
  { id: 'p-36', kelas_id: 'k-005-xii-rpl1', guru_id: 'g-001-fauzi', mapel_id: 'm-001-pai', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-37', kelas_id: 'k-005-xii-rpl1', guru_id: 'g-002-aminah', mapel_id: 'm-002-mtk', total_jtm: 4, blok_pertemuan: [2, 2] },
  { id: 'p-38', kelas_id: 'k-005-xii-rpl1', guru_id: 'g-003-budi', mapel_id: 'm-003-pweb', total_jtm: 4, blok_pertemuan: [4] },
  { id: 'p-39', kelas_id: 'k-005-xii-rpl1', guru_id: 'g-004-rina', mapel_id: 'm-004-bind', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-40', kelas_id: 'k-005-xii-rpl1', guru_id: 'g-007-eko', mapel_id: 'm-007-bing', total_jtm: 3, blok_pertemuan: [3] },
  { id: 'p-41', kelas_id: 'k-005-xii-rpl1', guru_id: 'g-008-maya', mapel_id: 'm-008-uiux', total_jtm: 4, blok_pertemuan: [4] },
  { id: 'p-42', kelas_id: 'k-005-xii-rpl1', guru_id: 'g-010-sri', mapel_id: 'm-010-ppkn', total_jtm: 2, blok_pertemuan: [2] },
];
