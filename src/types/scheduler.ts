/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HariAktif = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export type UserRole = 'admin' | 'guru' | 'kepsek';

export interface UserProfile {
  id: string; // UUID matching auth.users
  email: string;
  password?: string;
  nama_lengkap: string;
  role: UserRole;
  guru_id?: string; // Optional link to master_guru
  created_at?: string;
}

export type KategoriMapel = 'Reguler' | 'Muatan Lokal' | 'Keagamaan' | 'Kejuruan';

export type TipeSesi = 'belajar' | 'istirahat' | 'upacara' | 'sholat';

export interface GuruBerhalangan {
  hari: HariAktif;
  sesi: number[]; // daftar sesi ke- berapa guru tidak bisa mengajar
  keterangan?: string;
}

export interface MasterGuru {
  id: string; // UUID
  user_id?: string;
  nama_guru: string;
  kode_guru: string;
  max_jtm: number; // default 24
  nip?: string;
  warna_tag?: string;
  berhalangan?: GuruBerhalangan[];
}

export interface MasterMapel {
  id: string; // UUID
  nama_mapel: string;
  kode_mapel?: string;
  kategori: KategoriMapel;
  warna?: string;
  default_blok?: number; // e.g. 2, 3, 4 jam per pertemuan
}

export interface MasterKelas {
  id: string; // UUID
  nama_kelas: string;
  tingkat: string; // X, XI, XII atau 7, 8, 9
  jurusan?: string;
}

export interface MasterWaktu {
  id: string; // UUID
  hari: HariAktif;
  sesi_ke: number;
  jam_mulai: string; // '07:00'
  jam_selesai: string; // '07:45'
  is_istirahat: boolean;
  tipe_sesi: TipeSesi;
  label?: string; // e.g. 'Upacara Bendera', 'Istirahat 1', 'Sholat Jumat'
}

export interface PlottingBeban {
  id: string;
  kelas_id: string;
  guru_id: string;
  mapel_id: string;
  total_jtm: number; // e.g. 4 jam/minggu
  blok_pertemuan?: number[]; // e.g. [2, 2] artinya 2 pertemuan masing-masing 2 jam berurutan
}

export interface JadwalTersusunItem {
  id?: string;
  waktu_id: string;
  hari: HariAktif;
  sesi: number;
  kelas_id: string;
  mapel_id: string;
  guru_id: string;
}

export interface JadwalGagalItem {
  kelas_id: string;
  mapel_id: string;
  guru_id: string;
  jtm: number;
  alasan: string;
}

export interface SchedulerOutput {
  jadwal_tersusun: JadwalTersusunItem[];
  jadwal_gagal: JadwalGagalItem[];
  metadata?: {
    total_target_jtm: number;
    total_berhasil_jtm: number;
    total_gagal_jtm: number;
    persentase_sukses: number;
    solver: 'algorithmic' | 'gemini-ai';
    waktu_eksekusi_ms: number;
    timestamp: string;
    bentrok_terdeteksi: number;
  };
}

export interface SchoolProfile {
  nama_sekolah: string;
  instansi_pemerintah?: string; // e.g. 'PEMERINTAH ACEH'
  dinas_pendidikan?: string; // e.g. 'DINAS PENDIDIKAN DAN KEBUDAYAAN'
  cabang_dinas?: string; // e.g. 'CABANG DINAS WILAYAH KOTA BANDA ACEH'
  nama_kepsek: string;
  nip_kepsek: string;
  alamat_sekolah: string;
  jenjang: string; // e.g. 'MA/SMA', 'SMK', 'SMP/MTs'
  telepon?: string;
  email_sekolah?: string;
  kota_titi_mangsa?: string; // e.g. 'Banda Aceh', 'Jakarta'
  nama_waka_kurikulum?: string;
  nip_waka_kurikulum?: string;
  tahun_ajaran: string; // e.g. '2026/2027'
  semester: 'Ganjil' | 'Genap';
  logo_url?: string;
}

export interface JadwalPiketItem {
  id: string;
  hari: HariAktif;
  guru_id: string;
  tugas: string; // e.g. 'Piket Gerbang & Kedisiplinan', 'Piket KBM & Jam Kosong', 'Piket Ibadah/Musholla'
  lokasi?: string;
}

export interface ConflictAudit {
  valid: boolean;
  conflicts: {
    tipe: 'guru_bentrok' | 'kelas_bentrok' | 'guru_berhalangan' | 'slot_istirahat' | 'melebihi_max_jtm';
    pesan: string;
    hari: HariAktif;
    sesi: number;
    guru_id?: string;
    kelas_id?: string;
  }[];
}

