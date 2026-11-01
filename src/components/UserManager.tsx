/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Mail,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { MasterGuru, UserProfile, UserRole } from '../types/scheduler';

interface Props {
  users: UserProfile[];
  guruList: MasterGuru[];
  currentUser: UserProfile;
  onAddUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManager: React.FC<Props> = ({
  users,
  guruList,
  currentUser,
  onAddUser,
  onDeleteUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('guru');
  const [guruId, setGuruId] = useState<string>('');

  const handleOpenAdd = () => {
    setNamaLengkap('');
    setEmail('');
    setPassword('');
    setRole('guru');
    setGuruId(guruList[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !namaLengkap) return;

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      email: email.trim().toLowerCase(),
      password: password.trim() || 'admin',
      nama_lengkap: namaLengkap.trim(),
      role,
      guru_id: role === 'guru' ? guruId : undefined,
      created_at: new Date().toISOString(),
    };

    onAddUser(newUser);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Manajemen Pengguna Sistem (Supabase Profiles)
          </h3>
          <p className="text-xs text-slate-500">
            Kelola akun pengguna, hak akses peran (Admin, Guru, Kepala Sekolah), dan relasi akun guru
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Nama Pengguna</th>
                <th className="p-3.5">Email Akun</th>
                <th className="p-3.5">Peran (Role)</th>
                <th className="p-3.5">Tautan Guru</th>
                <th className="p-3.5">Tanggal Dibuat</th>
                <th className="p-3.5 text-right w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, idx) => {
                const linkedGuru = guruList.find((g) => g.id === u.guru_id);
                const isSelf = u.id === currentUser.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{u.nama_lengkap}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase ${
                          u.role === 'admin'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.role === 'kepsek'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {u.role === 'admin'
                          ? 'Admin Kurikulum'
                          : u.role === 'kepsek'
                          ? 'Kepala Sekolah'
                          : 'Guru Pengampu'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {linkedGuru ? (
                        <span className="font-semibold text-slate-800">
                          [{linkedGuru.kode_guru}] {linkedGuru.nama_guru}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="p-3.5 text-right">
                      {!isSelf ? (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Aktif</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Tambah Pengguna Baru
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
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Rian Pratama, S.Pd"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Pengguna</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rian@smk.belajar.id"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi (Password)</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role (Hak Akses)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="admin">Admin (Kurikulum & CRUD Seluruh Data)</option>
                  <option value="guru">Guru (Melihat Jadwal & Mengatur Ketersediaan)</option>
                  <option value="kepsek">Kepala Sekolah (Melihat & Menyetujui Jadwal)</option>
                </select>
              </div>

              {role === 'guru' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tautkan ke Data Master Guru
                  </label>
                  <select
                    value={guruId}
                    onChange={(e) => setGuruId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Guru --</option>
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>
                        [{g.kode_guru}] {g.nama_guru}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
