/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  GraduationCap,
  Layers,
  LayoutGrid,
  LogOut,
  Menu,
  Printer,
  RefreshCw,
  School,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { JadwalPiketManager } from './components/JadwalPiketManager';
import { LoginPage } from './components/LoginPage';
import { MasterDataManager } from './components/MasterDataManager';
import { PlottingEditor } from './components/PlottingEditor';
import { PrintPdfModal } from './components/PrintPdfModal';
import { SchedulerGenerator } from './components/SchedulerGenerator';
import { SchoolProfileEditor } from './components/SchoolProfileEditor';
import { NavTab, Sidebar } from './components/Sidebar';
import { SupabaseIntegration } from './components/SupabaseIntegration';
import { TimetableGrid } from './components/TimetableGrid';
import { UserManager } from './components/UserManager';
import {
  DEFAULT_SCHOOL_PROFILE,
  INITIAL_GURU,
  INITIAL_KELAS,
  INITIAL_MAPEL,
  INITIAL_PIKET,
  INITIAL_PLOTTING,
  INITIAL_USERS,
  INITIAL_WAKTU,
} from './data/initialData';
import { TimetableSolver } from './lib/schedulerEngine';
import {
  ConflictAudit,
  JadwalPiketItem,
  JadwalTersusunItem,
  MasterGuru,
  MasterKelas,
  MasterMapel,
  MasterWaktu,
  PlottingBeban,
  SchedulerOutput,
  SchoolProfile,
  UserProfile,
  UserRole,
} from './types/scheduler';

export default function App() {
  // Master data states
  const [guruList, setGuruList] = useState<MasterGuru[]>(INITIAL_GURU);
  const [mapelList, setMapelList] = useState<MasterMapel[]>(INITIAL_MAPEL);
  const [kelasList, setKelasList] = useState<MasterKelas[]>(INITIAL_KELAS);
  const [waktuList, setWaktuList] = useState<MasterWaktu[]>(INITIAL_WAKTU);
  const [plottingList, setPlottingList] = useState<PlottingBeban[]>(INITIAL_PLOTTING);

  // School Profile state (stored in localStorage)
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    try {
      const saved = localStorage.getItem('simjadwal_school_profile');
      return saved ? JSON.parse(saved) : DEFAULT_SCHOOL_PROFILE;
    } catch {
      return DEFAULT_SCHOOL_PROFILE;
    }
  });

  // Jadwal Piket state
  const [piketList, setPiketList] = useState<JadwalPiketItem[]>(() => {
    try {
      const saved = localStorage.getItem('simjadwal_piket_list');
      return saved ? JSON.parse(saved) : INITIAL_PIKET;
    } catch {
      return INITIAL_PIKET;
    }
  });

  // User Accounts state
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('jadwalpintar_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Current logged in user state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('jadwalpintar_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sidebar navigation & responsive collapse states
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scheduled timetable state
  const [jadwal, setJadwal] = useState<JadwalTersusunItem[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(
    null
  );

  // Global Print PDF modal state
  const [isGlobalPdfOpen, setIsGlobalPdfOpen] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseSyncedTime, setSupabaseSyncedTime] = useState<string | null>(null);

  // Solver instance
  const solver = useMemo(
    () => new TimetableSolver(guruList, mapelList, kelasList, waktuList),
    [guruList, mapelList, kelasList, waktuList]
  );

  // Persist school profile to localStorage
  const handleSaveProfile = (updatedProfile: SchoolProfile) => {
    setSchoolProfile(updatedProfile);
    try {
      localStorage.setItem('simjadwal_school_profile', JSON.stringify(updatedProfile));
    } catch (e) {
      console.error(e);
    }
    setNotification({
      type: 'success',
      text: `Profil "${updatedProfile.nama_sekolah}" berhasil diperbarui!`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Persist piket to localStorage
  const handleAddPiket = (item: JadwalPiketItem) => {
    setPiketList((prev) => {
      const updated = [...prev, item];
      try {
        localStorage.setItem('simjadwal_piket_list', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setNotification({
      type: 'success',
      text: 'Guru piket berhasil ditambahkan ke jadwal harian.',
    });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleDeletePiket = (id: string) => {
    setPiketList((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('simjadwal_piket_list', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setNotification({
      type: 'info',
      text: 'Petugas piket berhasil dihapus.',
    });
    setTimeout(() => setNotification(null), 2500);
  };

  // Save users to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('jadwalpintar_users', JSON.stringify(usersList));
    } catch (e) {
      console.error(e);
    }
  }, [usersList]);

  // Purge legacy demo data from localStorage and fetch from Supabase
  const fetchFromSupabase = async (isManual = false) => {
    setIsSyncingSupabase(true);
    try {
      const storedKey = localStorage.getItem('jadwalpintar_supabase_key') || '';
      const url = `/api/supabase/data${storedKey ? `?apiKey=${encodeURIComponent(storedKey)}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && json.hasData && json.data) {
        if (json.data.guru && json.data.guru.length > 0) {
          setGuruList(
            json.data.guru.map((g: any) => ({
              id: g.id,
              nama_guru: g.nama_guru,
              kode_guru: g.kode_guru,
              nip: g.nip,
              max_jtm: g.max_jtm || 24,
              warna_tag: g.warna_tag || '#2563eb',
              berhalangan: g.berhalangan || [],
            }))
          );
        }
        if (json.data.mapel && json.data.mapel.length > 0) {
          setMapelList(
            json.data.mapel.map((m: any) => ({
              id: m.id,
              nama_mapel: m.nama_mapel,
              kode_mapel: m.kode_mapel || m.nama_mapel.substring(0, 4).toUpperCase(),
              kategori: m.kategori || 'Reguler',
              default_blok: m.default_blok || 2,
              warna: m.warna || '#3b82f6',
            }))
          );
        }
        if (json.data.kelas && json.data.kelas.length > 0) {
          setKelasList(
            json.data.kelas.map((k: any) => ({
              id: k.id,
              nama_kelas: k.nama_kelas,
              tingkat: k.tingkat || 'X',
              jurusan: k.jurusan || 'Umum',
            }))
          );
        }
        if (json.data.waktu && json.data.waktu.length > 0) {
          setWaktuList(
            json.data.waktu.map((w: any) => ({
              id: w.id,
              hari: w.hari,
              sesi_ke: w.sesi_ke,
              jam_mulai: w.jam_mulai,
              jam_selesai: w.jam_selesai,
              is_istirahat: Boolean(w.is_istirahat),
              label_khusus: w.label_khusus,
              tipe_sesi: w.tipe_sesi || (w.is_istirahat ? 'istirahat' : 'belajar'),
            }))
          );
        }
        if (json.data.plotting && json.data.plotting.length > 0) {
          setPlottingList(json.data.plotting);
        }
        if (json.data.profiles && json.data.profiles.length > 0) {
          setUsersList(
            json.data.profiles.map((p: any) => ({
              id: p.id,
              email: p.email,
              nama_lengkap: p.nama_lengkap,
              role: p.role || 'guru',
              guru_id: p.guru_id,
              created_at: p.created_at,
            }))
          );
        }

        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setSupabaseSyncedTime(timeStr);
        setNotification({
          type: 'success',
          text: `Data berhasil dimuat langsung dari Supabase Database Cloud (${timeStr}).`,
        });
      } else if (isManual) {
        setNotification({
          type: 'info',
          text: 'Tabel database Supabase saat ini masih kosong. Anda dapat menyinkronkan data lokal ke Supabase melalui tab "Supabase Cloud".',
        });
      }
    } catch (err) {
      console.warn('Gagal menghubungi Supabase backend:', err);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Mount effect: purge demo caches and connect to Supabase
  useEffect(() => {
    const demoKeys = [
      'jadwalpintar_demo_cleared',
      'jadwalpintar_guru',
      'jadwalpintar_mapel',
      'jadwalpintar_kelas',
      'jadwalpintar_waktu',
      'jadwalpintar_plotting',
      'jadwalpintar_jadwal',
    ];
    demoKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });

    fetchFromSupabase(false);

    // Initial timetable solve
    const initialResult = solver.solve(plottingList);
    setJadwal(initialResult.jadwal_tersusun);
  }, []);

  // Compute conflict audit in real-time whenever jadwal changes
  const conflictAudit: ConflictAudit = useMemo(() => {
    return solver.validate(jadwal);
  }, [solver, jadwal]);

  // Auth actions
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('jadwalpintar_current_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setNotification({
      type: 'success',
      text: `Selamat datang, ${user.nama_lengkap} (${user.role.toUpperCase()})!`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('jadwalpintar_current_user');
    } catch (e) {
      console.error(e);
    }
  };

  // User management actions
  const handleAddUser = (newUser: UserProfile) => {
    setUsersList((prev) => [...prev, newUser]);
    setNotification({
      type: 'success',
      text: `Pengguna baru "${newUser.nama_lengkap}" berhasil didaftarkan.`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteUser = (userId: string) => {
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
    setNotification({
      type: 'info',
      text: 'Pengguna berhasil dihapus.',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Master data update handlers
  const handleUpdateGuruList = (newList: MasterGuru[]) => {
    setGuruList(newList);
    const existingIds = new Set(newList.map((g) => g.id));
    setPlottingList((prev) => prev.filter((p) => existingIds.has(p.guru_id)));
    setJadwal((prev) => prev.filter((j) => existingIds.has(j.guru_id)));
    setNotification({ type: 'info', text: 'Data Master Guru berhasil diperbarui.' });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleUpdateMapelList = (newList: MasterMapel[]) => {
    setMapelList(newList);
    const existingIds = new Set(newList.map((m) => m.id));
    setPlottingList((prev) => prev.filter((p) => existingIds.has(p.mapel_id)));
    setJadwal((prev) => prev.filter((j) => existingIds.has(j.mapel_id)));
    setNotification({ type: 'info', text: 'Data Master Mata Pelajaran berhasil diperbarui.' });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleUpdateKelasList = (newList: MasterKelas[]) => {
    setKelasList(newList);
    const existingIds = new Set(newList.map((k) => k.id));
    setPlottingList((prev) => prev.filter((p) => existingIds.has(p.kelas_id)));
    setJadwal((prev) => prev.filter((j) => existingIds.has(j.kelas_id)));
    setNotification({ type: 'info', text: 'Data Master Kelas berhasil diperbarui.' });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleUpdateWaktuList = (newList: MasterWaktu[]) => {
    setWaktuList(newList);
    const existingIds = new Set(newList.map((w) => w.id));
    setJadwal((prev) => prev.filter((j) => existingIds.has(j.waktu_id)));
    setNotification({ type: 'info', text: 'Struktur waktu dan sesi berhasil diperbarui.' });
    setTimeout(() => setNotification(null), 2500);
  };

  // Schedule generated
  const handleScheduleGenerated = (result: SchedulerOutput) => {
    setJadwal(result.jadwal_tersusun);
    setNotification({
      type: 'success',
      text: `Penjadwalan berhasil! ${result.jadwal_tersusun.length} jam pelajaran tersusun bebas bentrok (${
        result.metadata?.solver === 'gemini-ai' ? 'Gemini 3.8 Flash' : 'Algoritma Heuristik'
      }).`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Plotting management
  const handleAddPlotting = (newP: PlottingBeban) => {
    setPlottingList((prev) => [...prev, newP]);
    setNotification({ type: 'info', text: 'Plotting beban mengajar berhasil ditambahkan.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdatePlotting = (updated: PlottingBeban) => {
    setPlottingList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setNotification({ type: 'info', text: 'Data plotting berhasil diperbarui.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeletePlotting = (id: string) => {
    setPlottingList((prev) => prev.filter((p) => p.id !== id));
    setNotification({ type: 'info', text: 'Plotting berhasil dihapus.' });
    setTimeout(() => setNotification(null), 3000);
  };

  // If user is not logged in, render the LoginPage
  if (!currentUser) {
    return <LoginPage users={usersList} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex overflow-x-hidden font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Desktop Left Sidebar (visible on md+) */}
      <div className="hidden md:flex flex-col">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'print') {
              setIsGlobalPdfOpen(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          schoolProfile={schoolProfile}
          currentUser={currentUser}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenPrintModal={() => setIsGlobalPdfOpen(true)}
        />
      </div>

      {/* Mobile Drawer (visible on < md when opened) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/70 backdrop-blur-xs">
          <div className="w-72 max-w-[85vw] h-full flex flex-col bg-[#09101d]">
            <div className="p-3 flex justify-end border-b border-slate-800">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setIsMobileMenuOpen(false);
                if (tab === 'print') {
                  setIsGlobalPdfOpen(true);
                } else {
                  setCurrentTab(tab);
                }
              }}
              schoolProfile={schoolProfile}
              currentUser={currentUser}
              onLogout={handleLogout}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileMenuOpen(false)}
              onOpenPrintModal={() => setIsGlobalPdfOpen(true)}
            />
          </div>
          <div
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Navbar Header */}
        <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger menu toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Active Tab Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight text-slate-900">
                  {currentTab === 'dashboard' && 'Dashboard Generator & AI Studio'}
                  {currentTab === 'profile' && 'Profil Satuan Pendidikan & Waktu KBM'}
                  {currentTab === 'master' && 'Data Master (Guru, Mapel, Kelas)'}
                  {currentTab === 'plotting' && 'Distribusi SKBM & Beban Mengajar'}
                  {currentTab === 'grid' && 'Matrix Jadwal Pelajaran Mingguan'}
                  {currentTab === 'piket' && 'Jadwal Petugas Guru Piket Harian'}
                  {currentTab === 'users' && 'Manajemen Akun & Hak Akses Pengguna'}
                  {currentTab === 'supabase' && 'Integrasi Supabase Cloud & Export SQL'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                  {schoolProfile.nama_sekolah}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Semester {schoolProfile.semester} &bull; Tahun Ajaran {schoolProfile.tahun_ajaran}
              </p>
            </div>
          </div>

          {/* Quick Status Chips & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Real-time Conflict Chip */}
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-[11px] font-bold ${
                conflictAudit.valid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {conflictAudit.valid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden sm:inline">100% Bebas Bentrok</span>
                  <span className="sm:hidden">0 Bentrok</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{conflictAudit.conflicts.length} Bentrok</span>
                </>
              )}
            </div>

            {/* Supabase Sync Button */}
            <button
              onClick={() => fetchFromSupabase(true)}
              disabled={isSyncingSupabase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors border border-emerald-200"
              title="Tarik & Sinkronkan Data dari Database Supabase"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-600 ${
                  isSyncingSupabase ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden sm:inline">
                {isSyncingSupabase
                  ? 'Sinkron...'
                  : supabaseSyncedTime
                  ? `Supabase (${supabaseSyncedTime})`
                  : 'Tarik Supabase'}
              </span>
            </button>

            {/* Global Print PDF Button */}
            <button
              onClick={() => setIsGlobalPdfOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content View */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {currentTab === 'dashboard' && (
            <SchedulerGenerator
              guruList={guruList}
              mapelList={mapelList}
              kelasList={kelasList}
              waktuList={waktuList}
              plottingList={plottingList}
              jadwal={jadwal}
              onScheduleGenerated={handleScheduleGenerated}
              conflictAudit={conflictAudit}
            />
          )}

          {currentTab === 'profile' && (
            <SchoolProfileEditor
              profile={schoolProfile}
              onSaveProfile={handleSaveProfile}
              waktuList={waktuList}
              onUpdateWaktuList={handleUpdateWaktuList}
            />
          )}

          {currentTab === 'grid' && (
            <TimetableGrid
              jadwal={jadwal}
              waktuList={waktuList}
              kelasList={kelasList}
              guruList={guruList}
              mapelList={mapelList}
              schoolProfile={schoolProfile}
              onUpdateWaktuList={handleUpdateWaktuList}
            />
          )}

          {currentTab === 'plotting' && (
            <PlottingEditor
              plottings={plottingList}
              guruList={guruList}
              mapelList={mapelList}
              kelasList={kelasList}
              onAddPlotting={handleAddPlotting}
              onUpdatePlotting={handleUpdatePlotting}
              onDeletePlotting={handleDeletePlotting}
            />
          )}

          {currentTab === 'master' && (
            <MasterDataManager
              guruList={guruList}
              mapelList={mapelList}
              kelasList={kelasList}
              waktuList={waktuList}
              onUpdateGuruList={handleUpdateGuruList}
              onUpdateMapelList={handleUpdateMapelList}
              onUpdateKelasList={handleUpdateKelasList}
              onUpdateWaktuList={handleUpdateWaktuList}
            />
          )}

          {currentTab === 'piket' && (
            <JadwalPiketManager
              piketList={piketList}
              guruList={guruList}
              schoolProfile={schoolProfile}
              onAddPiket={handleAddPiket}
              onDeletePiket={handleDeletePiket}
            />
          )}

          {currentTab === 'users' && (
            <UserManager
              users={usersList}
              guruList={guruList}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {currentTab === 'supabase' && (
            <SupabaseIntegration
              jadwal={jadwal}
              guruList={guruList}
              mapelList={mapelList}
              kelasList={kelasList}
              waktuList={waktuList}
              plottings={plottingList}
            />
          )}
        </main>

        {/* Global Print PDF Modal with dynamic schoolProfile */}
        <PrintPdfModal
          isOpen={isGlobalPdfOpen}
          onClose={() => setIsGlobalPdfOpen(false)}
          jadwal={jadwal}
          waktuList={waktuList}
          kelasList={kelasList}
          guruList={guruList}
          mapelList={mapelList}
          schoolProfile={schoolProfile}
        />

        {/* Footer */}
        <footer className="no-print bg-white border-t border-slate-200 mt-auto py-5 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">
                  SIM-JADWAL SEKOLAH &bull; {schoolProfile.nama_sekolah} ({schoolProfile.jenjang})
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span>Anti-Bentrok (Hard Constraint)</span>
                <span>&bull;</span>
                <span>Blok Waktu Berurutan</span>
                <span>&bull;</span>
                <span>Database Supabase Cloud</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
              <div>
                Developer: <span className="font-bold text-slate-700">Muhammad Ifwandi, S.Pd., M.Pd.</span>
              </div>
              <div>
                Basis Data Cloud: <span className="font-mono text-emerald-600 font-semibold">https://obpgeccazckossgulqom.supabase.co</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
