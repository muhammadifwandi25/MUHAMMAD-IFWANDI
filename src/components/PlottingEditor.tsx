/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Edit2,
  Filter,
  Layers,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  MasterGuru,
  MasterKelas,
  MasterMapel,
  PlottingBeban,
} from '../types/scheduler';

interface Props {
  plottings: PlottingBeban[];
  guruList: MasterGuru[];
  mapelList: MasterMapel[];
  kelasList: MasterKelas[];
  onAddPlotting: (plotting: PlottingBeban) => void;
  onUpdatePlotting: (plotting: PlottingBeban) => void;
  onDeletePlotting: (id: string) => void;
}

export const PlottingEditor: React.FC<Props> = ({
  plottings,
  guruList,
  mapelList,
  kelasList,
  onAddPlotting,
  onUpdatePlotting,
  onDeletePlotting,
}) => {
  const [filterKelasId, setFilterKelasId] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formKelasId, setFormKelasId] = useState<string>(kelasList[0]?.id || '');
  const [formGuruId, setFormGuruId] = useState<string>(guruList[0]?.id || '');
  const [formMapelId, setFormMapelId] = useState<string>(mapelList[0]?.id || '');
  const [formTotalJtm, setFormTotalJtm] = useState<number>(3);
  const [formBlokStr, setFormBlokStr] = useState<string>('3');

  // Compute teacher loads
  const teacherLoadMap = new Map<string, number>();
  plottings.forEach((p) => {
    teacherLoadMap.set(p.guru_id, (teacherLoadMap.get(p.guru_id) || 0) + p.total_jtm);
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormKelasId(kelasList[0]?.id || '');
    setFormGuruId(guruList[0]?.id || '');
    setFormMapelId(mapelList[0]?.id || '');
    setFormTotalJtm(3);
    setFormBlokStr('3');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PlottingBeban) => {
    setEditingId(p.id);
    setFormKelasId(p.kelas_id);
    setFormGuruId(p.guru_id);
    setFormMapelId(p.mapel_id);
    setFormTotalJtm(p.total_jtm);
    setFormBlokStr((p.blok_pertemuan || [p.total_jtm]).join(', '));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse block string (e.g. "2, 2" or "3")
    const blocks = formBlokStr
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    const calculatedTotal = blocks.length > 0 ? blocks.reduce((a, b) => a + b, 0) : formTotalJtm;

    if (editingId) {
      onUpdatePlotting({
        id: editingId,
        kelas_id: formKelasId,
        guru_id: formGuruId,
        mapel_id: formMapelId,
        total_jtm: calculatedTotal,
        blok_pertemuan: blocks.length > 0 ? blocks : [calculatedTotal],
      });
    } else {
      onAddPlotting({
        id: `plot-${Date.now()}`,
        kelas_id: formKelasId,
        guru_id: formGuruId,
        mapel_id: formMapelId,
        total_jtm: calculatedTotal,
        blok_pertemuan: blocks.length > 0 ? blocks : [calculatedTotal],
      });
    }

    setIsModalOpen(false);
  };

  const filteredPlottings =
    filterKelasId === 'ALL' ? plottings : plottings.filter((p) => p.kelas_id === filterKelasId);

  const totalJtmFiltered = filteredPlottings.reduce((acc, p) => acc + p.total_jtm, 0);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Plotting Beban Mengajar Guru & Kelas
          </h3>
          <p className="text-xs text-slate-500">
            Penetapan alokasi Jam Tatap Muka (JTM) mingguan serta pemisahan blok jam berurutan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Kelas:</span>
            <select
              value={filterKelasId}
              onChange={(e) => setFilterKelasId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Semua Kelas ({plottings.length} Plotting)</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Plotting Beban
          </button>
        </div>
      </div>

      {/* Teacher Quota Overview Banner */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Status Alokasi Jam Mengajar per Guru (Target Max 24-28 JTM)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {guruList.map((g) => {
            const current = teacherLoadMap.get(g.id) || 0;
            const isOver = current > g.max_jtm;
            const isFull = current === g.max_jtm;

            return (
              <div
                key={g.id}
                className={`p-2.5 rounded-xl border text-xs ${
                  isOver
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : isFull
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px] truncate">{g.kode_guru}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isOver
                        ? 'bg-red-200 text-red-800'
                        : isFull
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {current}/{g.max_jtm} JTM
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate" title={g.nama_guru}>
                  {g.nama_guru.split(' ')[0]} {g.nama_guru.split(' ')[1] || ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plottings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Kelas</th>
                <th className="p-3.5">Mata Pelajaran</th>
                <th className="p-3.5">Guru Pengampu</th>
                <th className="p-3.5 text-center">Total JTM</th>
                <th className="p-3.5">Pola Blok Berurutan</th>
                <th className="p-3.5 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlottings.map((p, idx) => {
                const k = kelasList.find((x) => x.id === p.kelas_id);
                const m = mapelList.find((x) => x.id === p.mapel_id);
                const g = guruList.find((x) => x.id === p.guru_id);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200 text-slate-800">
                        {k?.nama_kelas || p.kelas_id}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{m?.nama_mapel}</div>
                      <div className="text-[10px] text-slate-500">
                        {m?.kategori} &bull; Kode: {m?.kode_mapel}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{g?.nama_guru}</div>
                      <div className="text-[10px] text-slate-500">
                        Kode: <strong className="font-mono">{g?.kode_guru}</strong> &bull; Max {g?.max_jtm} JTM
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                        {p.total_jtm} Jam
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        {(p.blok_pertemuan || [p.total_jtm]).map((blok, bIdx) => (
                          <span
                            key={bIdx}
                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200"
                            title="Blok jam berurutan di hari yang sama"
                          >
                            {blok} Jam
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit Plotting"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePlotting(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus Plotting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>Menampilkan {filteredPlottings.length} data plotting</span>
          <span>
            Total Beban:{' '}
            <strong className="text-slate-900 font-bold">{totalJtmFiltered} Jam Tatap Muka (JTM)</strong>
          </span>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingId ? 'Edit Plotting Beban Mengajar' : 'Tambah Plotting Beban Mengajar'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Kelas</label>
                <select
                  value={formKelasId}
                  onChange={(e) => setFormKelasId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas} ({k.tingkat} - {k.jurusan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                <select
                  value={formMapelId}
                  onChange={(e) => setFormMapelId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama_mapel} ({m.kategori})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guru Pengampu</label>
                <select
                  value={formGuruId}
                  onChange={(e) => setFormGuruId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {guruList.map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.kode_guru}] {g.nama_guru} (Max {g.max_jtm} JTM)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Format Blok Jam Berurutan (Pisahkan koma jika beberapa pertemuan)
                </label>
                <input
                  type="text"
                  value={formBlokStr}
                  onChange={(e) => setFormBlokStr(e.target.value)}
                  placeholder="Contoh: 2, 2 (4 JTM total) atau 3"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Contoh: &quot;4&quot; = 1 sesi 4 jam berturut-turut. &quot;2, 2&quot; = 2 sesi berbeda masing-masing 2 jam berturut-turut.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  Simpan Plotting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
