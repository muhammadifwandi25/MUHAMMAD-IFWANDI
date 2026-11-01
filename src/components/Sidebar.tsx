/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Code2,
  Database,
  Layers,
  LayoutGrid,
  LogOut,
  Printer,
  School,
  Sparkles,
  Users,
} from 'lucide-react';
import { SchoolProfile, UserProfile } from '../types/scheduler';

export type NavTab =
  | 'dashboard'
  | 'profile'
  | 'master'
  | 'plotting'
  | 'grid'
  | 'piket'
  | 'print'
  | 'users'
  | 'supabase';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  schoolProfile: SchoolProfile;
  currentUser: UserProfile;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenPrintModal: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  schoolProfile,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  onOpenPrintModal,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutGrid,
      badge: null,
    },
    {
      id: 'profile' as NavTab,
      label: 'Profil & Waktu',
      icon: Clock,
      badge: null,
    },
    {
      id: 'master' as NavTab,
      label: 'Data Master',
      icon: Database,
      badge: null,
    },
    {
      id: 'plotting' as NavTab,
      label: 'Distribusi SKBM',
      icon: Layers,
      badge: null,
    },
    {
      id: 'grid' as NavTab,
      label: 'Matrix Jadwal',
      icon: Calendar,
      badge: 'Core',
    },
    {
      id: 'piket' as NavTab,
      label: 'Jadwal Piket',
      icon: CalendarCheck,
      badge: null,
    },
    {
      id: 'print' as NavTab,
      label: 'Laporan & Cetak',
      icon: Printer,
      badge: null,
      customAction: () => onOpenPrintModal(),
    },
    {
      id: 'users' as NavTab,
      label: 'Manajemen User',
      icon: Users,
      badge: null,
    },
    {
      id: 'supabase' as NavTab,
      label: 'Supabase Cloud',
      icon: Cloud,
      badge: null,
    },
  ];

  return (
    <aside
      className={`no-print transition-all duration-300 ease-in-out shrink-0 bg-[#09101d] text-slate-300 border-r border-slate-800/80 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-sm tracking-tight text-white truncate">
                  SIM-JADWAL SEKOLAH
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-extrabold text-[10px] shrink-0">
                  {schoolProfile.jenjang || 'MA/SMA'}
                </span>
              </div>
              <p
                className="text-[11px] font-semibold text-emerald-400 truncate mt-0.5"
                title={schoolProfile.nama_sekolah}
              >
                {schoolProfile.nama_sekolah || 'SMA 1 BANDA ACEH'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Nav header & collapse toggle */}
        <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {!isCollapsed && <span>MENU NAVIGASI</span>}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Menu Buttons */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.customAction) {
                  item.customAction();
                }
                onSelectTab(item.id);
              }}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}
              />

              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Info & User Profile */}
      <div className="p-3 border-t border-slate-800/70 space-y-3 bg-[#070d18]">
        {/* Developer Credit */}
        {!isCollapsed && (
          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Code2 className="w-3.5 h-3.5" />
              <span>Developer Aplikasi</span>
            </div>
            <p className="font-semibold text-slate-200 truncate">
              Muhammad Ifwandi, S.Pd., M.Pd.
            </p>
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
              {currentUser.nama_lengkap.charAt(0)}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.nama_lengkap}
                </div>
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">
                  {currentUser.role}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors shrink-0"
            title="Keluar (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
