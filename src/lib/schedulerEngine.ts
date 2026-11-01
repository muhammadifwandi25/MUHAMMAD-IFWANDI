/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ConflictAudit,
  HariAktif,
  JadwalGagalItem,
  JadwalTersusunItem,
  MasterGuru,
  MasterKelas,
  MasterMapel,
  MasterWaktu,
  PlottingBeban,
  SchedulerOutput,
} from '../types/scheduler';

interface SlotRef {
  waktu: MasterWaktu;
  hari: HariAktif;
  sesi: number;
  waktu_id: string;
}

interface PlottingTask {
  id: string;
  kelas_id: string;
  guru_id: string;
  mapel_id: string;
  durasi: number; // Block length: 2, 3, or 4 JTM
  taskIndex: number;
}

export class TimetableSolver {
  private guruMap: Map<string, MasterGuru> = new Map();
  private mapelMap: Map<string, MasterMapel> = new Map();
  private kelasMap: Map<string, MasterKelas> = new Map();
  private waktuList: MasterWaktu[] = [];

  constructor(
    guru: MasterGuru[],
    mapel: MasterMapel[],
    kelas: MasterKelas[],
    waktu: MasterWaktu[]
  ) {
    guru.forEach((g) => this.guruMap.set(g.id, g));
    mapel.forEach((m) => this.mapelMap.set(m.id, m));
    kelas.forEach((k) => this.kelasMap.set(k.id, k));
    this.waktuList = [...waktu].sort((a, b) => {
      if (a.hari !== b.hari) return a.hari.localeCompare(b.hari);
      return a.sesi_ke - b.sesi_ke;
    });
  }

  /**
   * Filter and group valid study slots (is_istirahat == false)
   */
  public getStudySlots(): Map<HariAktif, SlotRef[]> {
    const slotsByDay = new Map<HariAktif, SlotRef[]>();
    const days: HariAktif[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    days.forEach((day) => slotsByDay.set(day, []));

    this.waktuList.forEach((w) => {
      if (!w.is_istirahat) {
        const list = slotsByDay.get(w.hari);
        if (list) {
          list.push({
            waktu: w,
            hari: w.hari,
            sesi: w.sesi_ke,
            waktu_id: w.id,
          });
        }
      }
    });

    // Ensure sorted by session
    days.forEach((day) => {
      const list = slotsByDay.get(day);
      if (list) {
        list.sort((a, b) => a.sesi - b.sesi);
      }
    });

    return slotsByDay;
  }

  /**
   * Find contiguous session blocks within a day
   */
  public getContiguousBlocks(daySlots: SlotRef[], blockSize: number): SlotRef[][] {
    const blocks: SlotRef[][] = [];
    if (daySlots.length < blockSize) return blocks;

    for (let i = 0; i <= daySlots.length - blockSize; i++) {
      let isContiguous = true;
      for (let j = 1; j < blockSize; j++) {
        if (daySlots[i + j].sesi !== daySlots[i + j - 1].sesi + 1) {
          isContiguous = false;
          break;
        }
      }
      if (isContiguous) {
        blocks.push(daySlots.slice(i, i + blockSize));
      }
    }
    return blocks;
  }

  /**
   * Main Constraint Satisfaction Algorithm
   */
  public solve(plottings: PlottingBeban[]): SchedulerOutput {
    const startTime = performance.now();
    const scheduledItems: JadwalTersusunItem[] = [];
    const failedItems: JadwalGagalItem[] = [];

    // Breakdown plottings into discrete blocks based on blok_pertemuan or total_jtm
    const tasks: PlottingTask[] = [];
    let totalTargetJtm = 0;

    plottings.forEach((p, pIndex) => {
      totalTargetJtm += p.total_jtm;
      let remaining = p.total_jtm;

      if (p.blok_pertemuan && p.blok_pertemuan.length > 0) {
        p.blok_pertemuan.forEach((dur, bIdx) => {
          tasks.push({
            id: `${p.id}-b${bIdx}`,
            kelas_id: p.kelas_id,
            guru_id: p.guru_id,
            mapel_id: p.mapel_id,
            durasi: dur,
            taskIndex: pIndex,
          });
          remaining -= dur;
        });
      }

      // If any remainder
      while (remaining > 0) {
        const dur = remaining >= 4 ? 4 : remaining >= 3 ? 3 : remaining >= 2 ? 2 : 1;
        tasks.push({
          id: `${p.id}-rem-${remaining}`,
          kelas_id: p.kelas_id,
          guru_id: p.guru_id,
          mapel_id: p.mapel_id,
          durasi: dur,
          taskIndex: pIndex,
        });
        remaining -= dur;
      }
    });

    // Sort tasks heuristically:
    // 1. Larger blocks first (4, 3, 2, 1) - Most Constrained Variable (MCV)
    // 2. Teachers with more unavailability restrictions first
    tasks.sort((a, b) => {
      if (b.durasi !== a.durasi) return b.durasi - a.durasi;
      const gA = this.guruMap.get(a.guru_id);
      const gB = this.guruMap.get(b.guru_id);
      const unavailA = gA?.berhalangan?.reduce((acc, h) => acc + h.sesi.length, 0) || 0;
      const unavailB = gB?.berhalangan?.reduce((acc, h) => acc + h.sesi.length, 0) || 0;
      return unavailB - unavailA;
    });

    const studySlots = this.getStudySlots();
    const days: HariAktif[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

    // Tracking state for anti-conflict matrices
    // Key: `${hari}-${sesi}` -> Set of occupied guru_id and kelas_id
    const guruOccupied = new Map<string, string>(); // `${guru_id}-${hari}-${sesi}` -> kelas_id
    const kelasOccupied = new Map<string, string>(); // `${kelas_id}-${hari}-${sesi}` -> guru_id

    // Tracking for soft constraints:
    // kelas_id -> Map of day -> set of mapel_ids (avoid same mapel consecutive days)
    const kelasDayMapel = new Map<string, Map<HariAktif, Set<string>>>();
    // guru_id -> Map of day -> array of sessions taught (for minimizing gaps)
    const guruDaySessions = new Map<string, Map<HariAktif, number[]>>();

    // Helper: is slot available for teacher and class?
    const isSlotAvailable = (guru_id: string, kelas_id: string, hari: HariAktif, sesi: number): boolean => {
      // 1. Check Hard Constraint: Guru conflict
      if (guruOccupied.has(`${guru_id}-${hari}-${sesi}`)) return false;

      // 2. Check Hard Constraint: Kelas conflict
      if (kelasOccupied.has(`${kelas_id}-${hari}-${sesi}`)) return false;

      // 3. Check Teacher Unavailability
      const teacher = this.guruMap.get(guru_id);
      if (teacher?.berhalangan) {
        for (const unavail of teacher.berhalangan) {
          if (unavail.hari === hari && unavail.sesi.includes(sesi)) {
            return false;
          }
        }
      }

      return true;
    };

    // Helper: evaluate soft constraint score (lower is better)
    const calculateSoftPenalty = (
      task: PlottingTask,
      hari: HariAktif,
      blockSlots: SlotRef[]
    ): number => {
      let penalty = 0;

      // Penalty 1: Has this class already had this subject on this day or adjacent day?
      const dayMap = kelasDayMapel.get(task.kelas_id);
      if (dayMap) {
        if (dayMap.get(hari)?.has(task.mapel_id)) {
          penalty += 200; // heavy penalty for same subject on same day
        }
        const dayIdx = days.indexOf(hari);
        if (dayIdx > 0) {
          const prevDay = days[dayIdx - 1];
          if (dayMap.get(prevDay)?.has(task.mapel_id)) {
            penalty += 15; // soft penalty for adjacent days
          }
        }
      }

      // Penalty 2: Minimize gaps in teacher's day
      const gSessionsMap = guruDaySessions.get(task.guru_id);
      if (gSessionsMap) {
        const currentSessions = gSessionsMap.get(hari) || [];
        if (currentSessions.length > 0) {
          const newSesiMin = Math.min(...blockSlots.map((s) => s.sesi));
          const newSesiMax = Math.max(...blockSlots.map((s) => s.sesi));
          const existingMin = Math.min(...currentSessions);
          const existingMax = Math.max(...currentSessions);

          // If adjacent to existing sessions, reward it!
          if (newSesiMin === existingMax + 1 || newSesiMax === existingMin - 1) {
            penalty -= 10; // Consecutive hours for teacher is great
          } else {
            const gap = Math.min(
              Math.abs(newSesiMin - existingMax),
              Math.abs(existingMin - newSesiMax)
            );
            if (gap > 2) {
              penalty += gap * 5; // Penalty for large floating gaps
            }
          }
        }
      }

      return penalty;
    };

    // Execute scheduling loop for each task
    for (const task of tasks) {
      let bestPlacement: { hari: HariAktif; slots: SlotRef[]; penalty: number } | null = null;

      // Evaluate candidate days & blocks
      for (const hari of days) {
        const daySlots = studySlots.get(hari) || [];
        const candidateBlocks = this.getContiguousBlocks(daySlots, task.durasi);

        for (const block of candidateBlocks) {
          // Check if ALL slots in the contiguous block are strictly available
          const allFree = block.every((slot) =>
            isSlotAvailable(task.guru_id, task.kelas_id, hari, slot.sesi)
          );

          if (allFree) {
            const penalty = calculateSoftPenalty(task, hari, block);
            if (!bestPlacement || penalty < bestPlacement.penalty) {
              bestPlacement = { hari, slots: block, penalty };
              if (penalty <= 0) break; // Optimal enough, early exit
            }
          }
        }
      }

      if (bestPlacement) {
        // Commit placement
        for (const slot of bestPlacement.slots) {
          guruOccupied.set(`${task.guru_id}-${bestPlacement.hari}-${slot.sesi}`, task.kelas_id);
          kelasOccupied.set(`${task.kelas_id}-${bestPlacement.hari}-${slot.sesi}`, task.guru_id);

          scheduledItems.push({
            waktu_id: slot.waktu_id,
            hari: bestPlacement.hari,
            sesi: slot.sesi,
            kelas_id: task.kelas_id,
            mapel_id: task.mapel_id,
            guru_id: task.guru_id,
          });

          // Update tracking
          if (!kelasDayMapel.has(task.kelas_id)) {
            kelasDayMapel.set(task.kelas_id, new Map());
          }
          const cMap = kelasDayMapel.get(task.kelas_id)!;
          if (!cMap.has(bestPlacement.hari)) {
            cMap.set(bestPlacement.hari, new Set());
          }
          cMap.get(bestPlacement.hari)!.add(task.mapel_id);

          if (!guruDaySessions.has(task.guru_id)) {
            guruDaySessions.set(task.guru_id, new Map());
          }
          const gMap = guruDaySessions.get(task.guru_id)!;
          if (!gMap.has(bestPlacement.hari)) {
            gMap.set(bestPlacement.hari, []);
          }
          gMap.get(bestPlacement.hari)!.push(slot.sesi);
        }
      } else {
        // Failed to place block
        const guru = this.guruMap.get(task.guru_id);
        const kelas = this.kelasMap.get(task.kelas_id);
        const mapel = this.mapelMap.get(task.mapel_id);

        failedItems.push({
          kelas_id: task.kelas_id,
          mapel_id: task.mapel_id,
          guru_id: task.guru_id,
          jtm: task.durasi,
          alasan: `Tidak ditemukan slot berurutan ${task.durasi} JTM bebas bentrok untuk Guru ${guru?.nama_guru || task.guru_id} di Kelas ${kelas?.nama_kelas || task.kelas_id} (Mata Pelajaran: ${mapel?.nama_mapel || task.mapel_id}) akibat kepadatan jadwal atau pembatasan ketersediaan guru.`,
        });
      }
    }

    const endTime = performance.now();
    const totalScheduledJtm = scheduledItems.length;
    const totalFailedJtm = failedItems.reduce((acc, f) => acc + f.jtm, 0);

    return {
      jadwal_tersusun: scheduledItems,
      jadwal_gagal: failedItems,
      metadata: {
        total_target_jtm: totalTargetJtm,
        total_berhasil_jtm: totalScheduledJtm,
        total_gagal_jtm: totalFailedJtm,
        persentase_sukses:
          totalTargetJtm > 0 ? Math.round((totalScheduledJtm / totalTargetJtm) * 100) : 100,
        solver: 'algorithmic',
        waktu_eksekusi_ms: Math.round(endTime - startTime),
        timestamp: new Date().toISOString(),
        bentrok_terdeteksi: 0,
      },
    };
  }

  /**
   * Validate an existing or AI-generated schedule against hard & soft constraints
   */
  public validate(items: JadwalTersusunItem[]): ConflictAudit {
    const conflicts: ConflictAudit['conflicts'] = [];
    const guruTimeMap = new Map<string, JadwalTersusunItem>();
    const kelasTimeMap = new Map<string, JadwalTersusunItem>();
    const guruJtmCount = new Map<string, number>();

    for (const item of items) {
      const timeKey = `${item.hari}-${item.sesi}`;
      const guruKey = `${item.guru_id}-${timeKey}`;
      const kelasKey = `${item.kelas_id}-${timeKey}`;

      // Check Hard 1: Guru conflict
      if (guruTimeMap.has(guruKey)) {
        const prev = guruTimeMap.get(guruKey)!;
        const guru = this.guruMap.get(item.guru_id);
        const k1 = this.kelasMap.get(prev.kelas_id)?.nama_kelas || prev.kelas_id;
        const k2 = this.kelasMap.get(item.kelas_id)?.nama_kelas || item.kelas_id;
        conflicts.push({
          tipe: 'guru_bentrok',
          pesan: `Guru ${guru?.nama_guru || item.guru_id} bentrok di ${item.hari} sesi ${item.sesi} mengajar ganda di kelas ${k1} dan ${k2}.`,
          hari: item.hari,
          sesi: item.sesi,
          guru_id: item.guru_id,
        });
      } else {
        guruTimeMap.set(guruKey, item);
      }

      // Check Hard 2: Kelas conflict
      if (kelasTimeMap.has(kelasKey)) {
        const prev = kelasTimeMap.get(kelasKey)!;
        const kelas = this.kelasMap.get(item.kelas_id);
        const m1 = this.mapelMap.get(prev.mapel_id)?.nama_mapel || prev.mapel_id;
        const m2 = this.mapelMap.get(item.mapel_id)?.nama_mapel || item.mapel_id;
        conflicts.push({
          tipe: 'kelas_bentrok',
          pesan: `Kelas ${kelas?.nama_kelas || item.kelas_id} bentrok di ${item.hari} sesi ${item.sesi} dengan 2 mata pelajaran (${m1} vs ${m2}).`,
          hari: item.hari,
          sesi: item.sesi,
          kelas_id: item.kelas_id,
        });
      } else {
        kelasTimeMap.set(kelasKey, item);
      }

      // Check Break / Non-study slot
      const waktuObj = this.waktuList.find(
        (w) => w.hari === item.hari && w.sesi_ke === item.sesi
      );
      if (waktuObj?.is_istirahat) {
        conflicts.push({
          tipe: 'slot_istirahat',
          pesan: `Sesi ${item.hari} sesi ${item.sesi} adalah jam istirahat/ibadah (${waktuObj.label || 'Istirahat'}). Tidak boleh diisi pelajaran.`,
          hari: item.hari,
          sesi: item.sesi,
        });
      }

      // Check Teacher Unavailability
      const teacher = this.guruMap.get(item.guru_id);
      if (teacher?.berhalangan) {
        for (const unavail of teacher.berhalangan) {
          if (unavail.hari === item.hari && unavail.sesi.includes(item.sesi)) {
            conflicts.push({
              tipe: 'guru_berhalangan',
              pesan: `Guru ${teacher.nama_guru} dijadwalkan pada waktu berhalangan (${item.hari} sesi ${item.sesi}: ${unavail.keterangan || 'Izin/Tugas Luar'}).`,
              hari: item.hari,
              sesi: item.sesi,
              guru_id: item.guru_id,
            });
          }
        }
      }

      // Accumulate teacher JTM
      guruJtmCount.set(item.guru_id, (guruJtmCount.get(item.guru_id) || 0) + 1);
    }

    // Check Max JTM
    guruJtmCount.forEach((count, guru_id) => {
      const guru = this.guruMap.get(guru_id);
      if (guru && count > guru.max_jtm) {
        conflicts.push({
          tipe: 'melebihi_max_jtm',
          pesan: `Guru ${guru.nama_guru} memiliki total beban ${count} JTM melebihi batas maksimal ${guru.max_jtm} JTM mingguan.`,
          hari: 'Senin',
          sesi: 1,
          guru_id,
        });
      }
    });

    return {
      valid: conflicts.length === 0,
      conflicts,
    };
  }

  /**
   * Helper to format pure JSON input as required by the user's prompt specification
   */
  public generateSystemInputJson(plottings: PlottingBeban[]): {
    data_guru_dan_ketersediaan: {
      guru_id: string;
      nama_guru: string;
      kode_guru: string;
      max_jtm: number;
      berhalangan: { hari: string; sesi: number[]; keterangan?: string }[];
    }[];
    data_kelas_dan_struktur_waktu: {
      daftar_kelas: { kelas_id: string; nama_kelas: string; tingkat: string }[];
      daftar_sesi_waktu: {
        waktu_id: string;
        hari: string;
        sesi_ke: number;
        jam_mulai: string;
        jam_selesai: string;
        is_istirahat: boolean;
        tipe_sesi: string;
        label?: string;
      }[];
    };
    plotting_beban_mengajar: {
      kelas_id: string;
      guru_id: string;
      mapel_id: string;
      total_jtm: number;
      blok_pertemuan?: number[];
    }[];
  } {
    return {
      data_guru_dan_ketersediaan: Array.from(this.guruMap.values()).map((g) => ({
        guru_id: g.id,
        nama_guru: g.nama_guru,
        kode_guru: g.kode_guru,
        max_jtm: g.max_jtm,
        berhalangan: g.berhalangan || [],
      })),
      data_kelas_dan_struktur_waktu: {
        daftar_kelas: Array.from(this.kelasMap.values()).map((k) => ({
          kelas_id: k.id,
          nama_kelas: k.nama_kelas,
          tingkat: k.tingkat,
        })),
        daftar_sesi_waktu: this.waktuList.map((w) => ({
          waktu_id: w.id,
          hari: w.hari,
          sesi_ke: w.sesi_ke,
          jam_mulai: w.jam_mulai,
          jam_selesai: w.jam_selesai,
          is_istirahat: w.is_istirahat,
          tipe_sesi: w.tipe_sesi,
          label: w.label,
        })),
      },
      plotting_beban_mengajar: plottings.map((p) => ({
        kelas_id: p.kelas_id,
        guru_id: p.guru_id,
        mapel_id: p.mapel_id,
        total_jtm: p.total_jtm,
        blok_pertemuan: p.blok_pertemuan,
      })),
    };
  }

  /**
   * Generate Supabase SQL Insert script
   */
  public generateSupabaseSQL(items: JadwalTersusunItem[]): string {
    if (items.length === 0) {
      return '-- Tidak ada jadwal yang tersusun untuk diexport.';
    }

    const header = `-- ====================================================================
-- Script SQL Export Jadwal Pelajaran untuk Supabase
-- Sesuai Skema Database:
-- CREATE TABLE jadwal_pelajaran (
--    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--    waktu_id UUID REFERENCES master_waktu(id) ON DELETE CASCADE,
--    kelas_id UUID REFERENCES master_kelas(id) ON DELETE CASCADE,
--    guru_id UUID REFERENCES master_guru(id) ON DELETE CASCADE,
--    mapel_id UUID REFERENCES master_mapel(id) ON DELETE CASCADE,
--    created_at TIMESTAMPTZ DEFAULT NOW(),
--    CONSTRAINT unique_guru_waktu UNIQUE (guru_id, waktu_id),
--    CONSTRAINT unique_kelas_waktu UNIQUE (kelas_id, waktu_id)
-- );
-- ====================================================================

BEGIN;

-- Opsional: Bersihkan jadwal lama terlebih dahulu jika ingin regenerasi total
-- TRUNCATE TABLE jadwal_pelajaran;

INSERT INTO jadwal_pelajaran (waktu_id, kelas_id, guru_id, mapel_id)
VALUES
`;

    const values = items
      .map(
        (it) =>
          `  ('${it.waktu_id}', '${it.kelas_id}', '${it.guru_id}', '${it.mapel_id}')`
      )
      .join(',\n');

    const footer = `\nON CONFLICT (kelas_id, waktu_id) DO UPDATE 
SET guru_id = EXCLUDED.guru_id,
    mapel_id = EXCLUDED.mapel_id;

COMMIT;

-- Berhasil generate ${items.length} slot jadwal pelajaran bebas bentrok!
`;

    return header + values + footer;
  }
}
