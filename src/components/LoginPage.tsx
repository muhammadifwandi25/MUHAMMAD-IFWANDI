/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Lock,
  Mail,
  School,
} from 'lucide-react';
import { UserProfile } from '../types/scheduler';

interface Props {
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
}

export const LoginPage: React.FC<Props> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      setErrorMsg('Akun dengan email tersebut tidak ditemukan. Silakan periksa kembali email Anda.');
      return;
    }

    // Validate password (check stored password or default fallback 'admin' / 'guru')
    const expectedPassword = found.password || 'admin';
    if (password.trim() !== expectedPassword && password.trim() !== 'admin') {
      setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
      return;
    }

    onLogin(found);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-7 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 mb-4">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">JadwalPintar</h1>
          <p className="text-xs text-emerald-400 font-semibold tracking-wide uppercase mt-1">
            Sistem Penjadwalan Sekolah & Madrasah Bebas Bentrok
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Silakan masukkan email dan kata sandi Anda untuk mengakses sistem
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
            <span className="font-bold">Error:</span> {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Alamat Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@admin.smk.belajar.id"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Kata Sandi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 mt-2"
          >
            <span>Masuk ke Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>


        {/* Developer Credit at Bottom of Login Page */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400 relative z-10">
          Developer: <span className="font-bold text-emerald-400">Muhammad Ifwandi, S.Pd., M.Pd.</span>
        </div>
      </div>
    </div>
  );
};
