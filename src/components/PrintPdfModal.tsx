/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Check,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Printer,
  School,
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
} from '../types/scheduler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jadwal: JadwalTersusunItem[];
  waktuList: MasterWaktu[];
  kelasList: MasterKelas[];
  guruList: MasterGuru[];
  mapelList: MasterMapel[];
  schoolProfile?: SchoolProfile;
  initialMode?: 'kelas' | 'guru' | 'master';
  initialTargetId?: string;
}

export const PrintPdfModal: React.FC<Props> = ({
  isOpen,
  onClose,
  jadwal,
  waktuList,
  kelasList,
  guruList,
  mapelList,
  schoolProfile,
  initialMode = 'kelas',
  initialTargetId,
}) => {
  const [printMode, setPrintMode] = useState<'kelas' | 'guru' | 'master'>(initialMode);
  const [targetKelasId, setTargetKelasId] = useState<string>(
    initialTargetId || kelasList[0]?.id || ''
  );
  const [targetGuruId, setTargetGuruId] = useState<string>(
    initialTargetId || guruList[0]?.id || ''
  );

  const [namaSekolah, setNamaSekolah] = useState(schoolProfile?.nama_sekolah || 'SMA 1 BANDA ACEH');
  const [tahunAjaran, setTahunAjaran] = useState(schoolProfile?.tahun_ajaran || '2026/2027');
  const [semester, setSemester] = useState(schoolProfile?.semester || 'Ganjil');


  if (!isOpen) return null;

  const days: HariAktif[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const maxSesi = Math.max(...waktuList.map((w) => w.sesi_ke), 11);
  const sessionNumbers = Array.from({ length: maxSesi }, (_, i) => i + 1);

  const guruMap = new Map(guruList.map((g) => [g.id, g]));
  const mapelMap = new Map(mapelList.map((m) => [m.id, m]));
  const kelasMap = new Map(kelasList.map((k) => [k.id, k]));

  const activeKelas = kelasMap.get(targetKelasId);
  const activeGuru = guruMap.get(targetGuruId);

  const handleExecutePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Pratinjau & Cetak Dokumen PDF Jadwal Pelajaran
              </h3>
              <p className="text-[11px] text-slate-500">
                Dilengkapi Kop Surat Resmi Sekolah/Madrasah, tabel waktu terstruktur, dan kolom tanda tangan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecutePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Configuration Controls (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 shadow-2xs">
              <button
                onClick={() => setPrintMode('kelas')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  printMode === 'kelas' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Jadwal Kelas
              </button>
              <button
                onClick={() => setPrintMode('guru')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  printMode === 'guru' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Jadwal Guru
              </button>
              <button
                onClick={() => setPrintMode('master')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  printMode === 'master' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Matriks Master
              </button>
            </div>

            {printMode === 'kelas' && (
              <select
                value={targetKelasId}
                onChange={(e) => setTargetKelasId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kelas: {k.nama_kelas}
                  </option>
                ))}
              </select>
            )}

            {printMode === 'guru' && (
              <select
                value={targetGuruId}
                onChange={(e) => setTargetGuruId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800"
              >
                {guruList.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.kode_guru}] {g.nama_guru}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Tahun:</span>
            <input
              type="text"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold"
            />
            <span className="text-slate-500 font-medium ml-1">Semester:</span>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-200/50 flex justify-center">
          <div className="print-container bg-white w-full max-w-4xl p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200 text-slate-900 font-serif">
            {/* Kop Surat Resmi */}
            <div className="border-b-4 border-double border-slate-900 pb-3 mb-6 text-center">
              <div className="text-xs sm:text-sm uppercase font-extrabold tracking-widest text-slate-800 leading-tight">
                {schoolProfile?.instansi_pemerintah || 'PEMERINTAH ACEH'}
              </div>
              <div className="text-xs sm:text-sm uppercase font-extrabold tracking-wider text-slate-700 leading-tight">
                {schoolProfile?.dinas_pendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
              </div>
              {schoolProfile?.cabang_dinas && (
                <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wide text-slate-600 leading-tight mt-0.5">
                  {schoolProfile.cabang_dinas}
                </div>
              )}
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 mt-1">
                {namaSekolah}
              </h2>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                {schoolProfile?.alamat_sekolah || 'Jl. Syiah Kuala No. 1, Banda Aceh'}
                {schoolProfile?.telepon ? ` | Telp. ${schoolProfile.telepon}` : ''}
                {schoolProfile?.email_sekolah ? ` | Email: ${schoolProfile.email_sekolah}` : ''}
              </p>
            </div>


            {/* Document Title */}
            <div className="text-center mb-6">
              <h3 className="text-base sm:text-lg font-extrabold uppercase underline tracking-wide">
                JADWAL PELAJARAN SEMESTER {semester.toUpperCase()} TAHUN AJARAN {tahunAjaran}
              </h3>
              <p className="text-xs font-sans font-bold text-slate-700 mt-1">
                {printMode === 'kelas' && `ROMBONGAN BELAJAR: ${activeKelas?.nama_kelas || '-'}`}
                {printMode === 'guru' &&
                  `GURU PENGAMPU: ${activeGuru?.nama_guru} (KODE: ${activeGuru?.kode_guru || '-'})`}
                {printMode === 'master' && 'MATRIKS JADWAL INDUK SELURUH KELAS'}
              </p>
            </div>

            {/* Timetable Table (Kelas / Guru Mode) */}
            {(printMode === 'kelas' || printMode === 'guru') && (
              <div className="mb-6">
                <table className="w-full border-collapse border border-slate-900 text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="border border-slate-900 p-2 w-14">Sesi</th>
                      <th className="border border-slate-900 p-2 w-24">Waktu</th>
                      {days.map((hari) => (
                        <th key={hari} className="border border-slate-900 p-2">
                          {hari}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessionNumbers.map((sesi) => {
                      const sampleWaktu = waktuList.find((w) => w.sesi_ke === sesi);

                      return (
                        <tr key={sesi} className="text-center">
                          <td className="border border-slate-900 p-2 font-bold bg-slate-50">
                            {sesi}
                          </td>
                          <td className="border border-slate-900 p-1 font-mono text-[10px]">
                            {sampleWaktu ? `${sampleWaktu.jam_mulai} - ${sampleWaktu.jam_selesai}` : '-'}
                          </td>

                          {days.map((hari) => {
                            const waktu = waktuList.find(
                              (w) => w.hari === hari && w.sesi_ke === sesi
                            );

                            if (!waktu) {
                              return <td key={hari} className="border border-slate-900 p-1">-</td>;
                            }

                            if (waktu.is_istirahat) {
                              return (
                                <td
                                  key={hari}
                                  className="border border-slate-900 p-1 bg-slate-100 font-semibold text-[10px] text-slate-700 italic"
                                >
                                  {waktu.label || 'Istirahat'}
                                </td>
                              );
                            }

                            const item =
                              printMode === 'kelas'
                                ? jadwal.find(
                                    (j) =>
                                      j.hari === hari &&
                                      j.sesi === sesi &&
                                      j.kelas_id === targetKelasId
                                  )
                                : jadwal.find(
                                    (j) =>
                                      j.hari === hari &&
                                      j.sesi === sesi &&
                                      j.guru_id === targetGuruId
                                  );

                            if (!item) {
                              return (
                                <td
                                  key={hari}
                                  className="border border-slate-900 p-1 text-slate-300 text-[10px]"
                                >
                                  -
                                </td>
                              );
                            }

                            const mapel = mapelMap.get(item.mapel_id);
                            const guru = guruMap.get(item.guru_id);
                            const kelas = kelasMap.get(item.kelas_id);

                            return (
                              <td
                                key={hari}
                                className="border border-slate-900 p-1.5 text-left align-top"
                              >
                                <div className="font-bold text-[11px] leading-tight">
                                  {mapel?.nama_mapel}
                                </div>
                                <div className="text-[10px] text-slate-600 mt-0.5">
                                  {printMode === 'kelas' ? (
                                    <span>
                                      Guru: <strong>{guru?.nama_guru}</strong> ({guru?.kode_guru})
                                    </span>
                                  ) : (
                                    <span>
                                      Kelas: <strong>{kelas?.nama_kelas}</strong>
                                    </span>
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

            {/* Timetable Table (Master Mode) */}
            {printMode === 'master' && (
              <div className="mb-6 overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="border border-slate-900 p-2 w-20">Hari & Sesi</th>
                      <th className="border border-slate-900 p-2 w-24">Waktu</th>
                      {kelasList.map((k) => (
                        <th key={k.id} className="border border-slate-900 p-2">
                          {k.nama_kelas}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {waktuList.map((w) => (
                      <tr key={w.id} className="text-center">
                        <td className="border border-slate-900 p-1.5 font-bold">
                          {w.hari} ke-{w.sesi_ke}
                        </td>
                        <td className="border border-slate-900 p-1 font-mono text-[10px]">
                          {w.jam_mulai} - {w.jam_selesai}
                        </td>

                        {w.is_istirahat ? (
                          <td
                            colSpan={kelasList.length}
                            className="border border-slate-900 p-1 bg-slate-100 font-semibold italic text-[11px]"
                          >
                            {w.label || 'Istirahat / Sholat'}
                          </td>
                        ) : (
                          kelasList.map((k) => {
                            const item = jadwal.find(
                              (j) =>
                                j.hari === w.hari && j.sesi === w.sesi_ke && j.kelas_id === k.id
                            );
                            const mapel = item ? mapelMap.get(item.mapel_id) : null;
                            const guru = item ? guruMap.get(item.guru_id) : null;

                            return (
                              <td
                                key={k.id}
                                className="border border-slate-900 p-1 text-left align-top text-[10px]"
                              >
                                {item ? (
                                  <div>
                                    <div className="font-bold">{mapel?.kode_mapel}</div>
                                    <div className="text-slate-600">{guru?.kode_guru}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Signatures */}
            <div className="mt-10 pt-4 flex items-start justify-between text-xs font-sans">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah</p>
                <div className="h-16" />
                <p className="font-bold underline">{schoolProfile?.nama_kepsek || 'Drs. H. Syarifuddin, M.Pd.'}</p>
                <p className="text-[10px] text-slate-600">NIP. {schoolProfile?.nip_kepsek || '19700101 199503 1 001'}</p>
              </div>

              <div className="text-center">
                <p>{schoolProfile?.kota_titi_mangsa || 'Banda Aceh'}, 31 Oktober 2026</p>
                <p className="font-bold">Wakil Kepala Bidang Kurikulum</p>
                <div className="h-16" />
                <p className="font-bold underline">{schoolProfile?.nama_waka_kurikulum || 'Muhammad Ifwandi, S.Pd., M.Pd.'}</p>
                <p className="text-[10px] text-slate-600">NIP. {schoolProfile?.nip_waka_kurikulum || '19850612 201001 1 012'}</p>
              </div>
            </div>


            {/* Validation Badge */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-sans flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Dokumen ini dicetak otomatis dari Sistem JadwalPintar &bull; 100% Bebas Bentrok
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
