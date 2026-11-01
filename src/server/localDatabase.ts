/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import net from 'net';

export interface LocalDbConfig {
  type: 'sqlite' | 'mysql' | 'postgres';
  sqlitePath: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password?: string;
  autoSave: boolean;
}

const DEFAULT_CONFIG: LocalDbConfig = {
  type: 'sqlite',
  sqlitePath: 'data/jadwal_lokal.sqlite',
  host: '127.0.0.1',
  port: 3306,
  databaseName: 'db_jadwal_sekolah',
  username: 'root',
  password: '',
  autoSave: true,
};

export class LocalDatabaseEngine {
  private db: DatabaseSync | null = null;
  private dbFilePath: string;
  private config: LocalDbConfig = { ...DEFAULT_CONFIG };

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbFilePath = path.join(dataDir, 'jadwal_lokal.sqlite');
    this.initDatabase();
  }

  private initDatabase() {
    try {
      this.db = new DatabaseSync(this.dbFilePath);
      // Enable WAL mode and foreign keys for high performance local storage
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA foreign_keys = ON;');

      this.createTables();
      this.loadConfig();
    } catch (err) {
      console.error('Failed to initialize local SQLite database:', err);
    }
  }

  private createTables() {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS school_profile (
        id TEXT PRIMARY KEY DEFAULT 'current',
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS master_guru (
        id TEXT PRIMARY KEY,
        nama_guru TEXT NOT NULL,
        kode_guru TEXT UNIQUE NOT NULL,
        max_jtm INTEGER DEFAULT 24,
        nip TEXT,
        warna_tag TEXT,
        berhalangan TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS master_mapel (
        id TEXT PRIMARY KEY,
        nama_mapel TEXT NOT NULL,
        kode_mapel TEXT UNIQUE NOT NULL,
        kategori TEXT DEFAULT 'Reguler',
        warna TEXT,
        default_blok INTEGER DEFAULT 2,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS master_kelas (
        id TEXT PRIMARY KEY,
        nama_kelas TEXT UNIQUE NOT NULL,
        tingkat TEXT,
        jurusan TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS master_waktu (
        id TEXT PRIMARY KEY,
        hari TEXT NOT NULL,
        sesi_ke INTEGER NOT NULL,
        jam_mulai TEXT NOT NULL,
        jam_selesai TEXT NOT NULL,
        is_istirahat INTEGER DEFAULT 0,
        tipe_sesi TEXT DEFAULT 'belajar',
        label TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS plotting_beban (
        id TEXT PRIMARY KEY,
        kelas_id TEXT NOT NULL,
        guru_id TEXT NOT NULL,
        mapel_id TEXT NOT NULL,
        total_jtm INTEGER NOT NULL,
        blok_pertemuan TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
        id TEXT PRIMARY KEY,
        waktu_id TEXT,
        hari TEXT NOT NULL,
        sesi INTEGER NOT NULL,
        kelas_id TEXT NOT NULL,
        mapel_id TEXT NOT NULL,
        guru_id TEXT NOT NULL,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS jadwal_piket (
        id TEXT PRIMARY KEY,
        hari TEXT NOT NULL,
        guru_id TEXT NOT NULL,
        tugas TEXT NOT NULL,
        lokasi TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        nama_lengkap TEXT NOT NULL,
        role TEXT NOT NULL,
        guru_id TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS db_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        detail TEXT,
        timestamp TEXT NOT NULL
      );
    `);
  }

  private loadConfig() {
    if (!this.db) return;
    try {
      const row = this.db.prepare("SELECT value FROM app_config WHERE key = 'local_db_config'").get() as any;
      if (row && row.value) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(row.value) };
      }
    } catch (e) {
      console.warn('Failed to load local db config, using defaults:', e);
    }
  }

  public saveConfig(newConfig: Partial<LocalDbConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (!this.db) return this.config;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO app_config (key, value, updated_at)
        VALUES ('local_db_config', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `);
      stmt.run(JSON.stringify(this.config), new Date().toISOString());
      this.logAudit('CONFIG_UPDATE', `Config updated for mode ${this.config.type}`);
    } catch (e) {
      console.error('Failed to save db config:', e);
    }
    return this.config;
  }

  public getConfig(): LocalDbConfig {
    return this.config;
  }

  public logAudit(action: string, detail: string) {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare('INSERT INTO db_audit_logs (action, detail, timestamp) VALUES (?, ?, ?)');
      stmt.run(action, detail, new Date().toISOString());
    } catch (e) {
      // silent
    }
  }

  public getStatus() {
    let fileSize = 0;
    try {
      if (fs.existsSync(this.dbFilePath)) {
        fileSize = fs.statSync(this.dbFilePath).size;
      }
    } catch {
      // ignore
    }

    const counts = {
      guru: 0,
      mapel: 0,
      kelas: 0,
      waktu: 0,
      plotting: 0,
      jadwal: 0,
      piket: 0,
      users: 0,
    };

    if (this.db) {
      try {
        counts.guru = (this.db.prepare('SELECT COUNT(*) as c FROM master_guru').get() as any)?.c || 0;
        counts.mapel = (this.db.prepare('SELECT COUNT(*) as c FROM master_mapel').get() as any)?.c || 0;
        counts.kelas = (this.db.prepare('SELECT COUNT(*) as c FROM master_kelas').get() as any)?.c || 0;
        counts.waktu = (this.db.prepare('SELECT COUNT(*) as c FROM master_waktu').get() as any)?.c || 0;
        counts.plotting = (this.db.prepare('SELECT COUNT(*) as c FROM plotting_beban').get() as any)?.c || 0;
        counts.jadwal = (this.db.prepare('SELECT COUNT(*) as c FROM jadwal_pelajaran').get() as any)?.c || 0;
        counts.piket = (this.db.prepare('SELECT COUNT(*) as c FROM jadwal_piket').get() as any)?.c || 0;
        counts.users = (this.db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
      } catch (e) {
        console.warn('Error reading counts from local sqlite:', e);
      }
    }

    return {
      connected: Boolean(this.db),
      type: this.config.type,
      databasePath: this.dbFilePath,
      fileSizeBytes: fileSize,
      fileSizeFormatted: `${(fileSize / 1024).toFixed(1)} KB`,
      tables: counts,
      hasData: counts.guru > 0 || counts.mapel > 0 || counts.kelas > 0,
      lastUpdated: new Date().toISOString(),
      config: this.config,
    };
  }

  public getAllData() {
    if (!this.db) {
      return {
        guru: [],
        mapel: [],
        kelas: [],
        waktu: [],
        plotting: [],
        jadwal: [],
        piket: [],
        profile: null,
        users: [],
      };
    }

    try {
      const guruRows = this.db.prepare('SELECT * FROM master_guru ORDER BY nama_guru ASC').all() as any[];
      const mapelRows = this.db.prepare('SELECT * FROM master_mapel ORDER BY nama_mapel ASC').all() as any[];
      const kelasRows = this.db.prepare('SELECT * FROM master_kelas ORDER BY tingkat ASC, nama_kelas ASC').all() as any[];
      const waktuRows = this.db.prepare('SELECT * FROM master_waktu ORDER BY sesi_ke ASC').all() as any[];
      const plottingRows = this.db.prepare('SELECT * FROM plotting_beban').all() as any[];
      const jadwalRows = this.db.prepare('SELECT * FROM jadwal_pelajaran').all() as any[];
      const piketRows = this.db.prepare('SELECT * FROM jadwal_piket').all() as any[];
      const userRows = this.db.prepare('SELECT * FROM users').all() as any[];
      const profileRow = this.db.prepare("SELECT data FROM school_profile WHERE id = 'current'").get() as any;

      return {
        guru: guruRows.map((g) => ({
          id: g.id,
          nama_guru: g.nama_guru,
          kode_guru: g.kode_guru,
          max_jtm: g.max_jtm,
          nip: g.nip,
          warna_tag: g.warna_tag,
          berhalangan: g.berhalangan ? JSON.parse(g.berhalangan) : [],
        })),
        mapel: mapelRows.map((m) => ({
          id: m.id,
          nama_mapel: m.nama_mapel,
          kode_mapel: m.kode_mapel,
          kategori: m.kategori,
          warna: m.warna,
          default_blok: m.default_blok,
        })),
        kelas: kelasRows.map((k) => ({
          id: k.id,
          nama_kelas: k.nama_kelas,
          tingkat: k.tingkat,
          jurusan: k.jurusan,
        })),
        waktu: waktuRows.map((w) => ({
          id: w.id,
          hari: w.hari,
          sesi_ke: w.sesi_ke,
          jam_mulai: w.jam_mulai,
          jam_selesai: w.jam_selesai,
          is_istirahat: Boolean(w.is_istirahat),
          tipe_sesi: w.tipe_sesi,
          label: w.label,
        })),
        plotting: plottingRows.map((p) => ({
          id: p.id,
          kelas_id: p.kelas_id,
          guru_id: p.guru_id,
          mapel_id: p.mapel_id,
          total_jtm: p.total_jtm,
          blok_pertemuan: p.blok_pertemuan ? JSON.parse(p.blok_pertemuan) : undefined,
        })),
        jadwal: jadwalRows.map((j) => ({
          id: j.id,
          waktu_id: j.waktu_id,
          hari: j.hari,
          sesi: j.sesi,
          kelas_id: j.kelas_id,
          mapel_id: j.mapel_id,
          guru_id: j.guru_id,
        })),
        piket: piketRows.map((p) => ({
          id: p.id,
          hari: p.hari,
          guru_id: p.guru_id,
          tugas: p.tugas,
          lokasi: p.lokasi,
        })),
        users: userRows.map((u) => ({
          id: u.id,
          email: u.email,
          nama_lengkap: u.nama_lengkap,
          role: u.role,
          guru_id: u.guru_id,
          created_at: u.created_at,
        })),
        profile: profileRow ? JSON.parse(profileRow.data) : null,
      };
    } catch (err) {
      console.error('Failed to read all data from local sqlite:', err);
      return {
        guru: [],
        mapel: [],
        kelas: [],
        waktu: [],
        plotting: [],
        jadwal: [],
        piket: [],
        profile: null,
        users: [],
      };
    }
  }

  public saveAllData(data: {
    guru?: any[];
    mapel?: any[];
    kelas?: any[];
    waktu?: any[];
    plotting?: any[];
    jadwal?: any[];
    piket?: any[];
    profile?: any;
    users?: any[];
  }) {
    if (!this.db) throw new Error('Local SQLite database not initialized');

    this.db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Profile
      if (data.profile) {
        const stmtProfile = this.db.prepare(`
          INSERT INTO school_profile (id, data, updated_at)
          VALUES ('current', ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
        `);
        stmtProfile.run(JSON.stringify(data.profile), new Date().toISOString());
      }

      // 2. Guru
      if (data.guru) {
        this.db.exec('DELETE FROM master_guru;');
        const stmtGuru = this.db.prepare(`
          INSERT INTO master_guru (id, nama_guru, kode_guru, max_jtm, nip, warna_tag, berhalangan, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const g of data.guru) {
          stmtGuru.run(
            g.id,
            g.nama_guru,
            g.kode_guru,
            g.max_jtm || 24,
            g.nip || null,
            g.warna_tag || '#2563eb',
            g.berhalangan ? JSON.stringify(g.berhalangan) : null,
            new Date().toISOString()
          );
        }
      }

      // 3. Mapel
      if (data.mapel) {
        this.db.exec('DELETE FROM master_mapel;');
        const stmtMapel = this.db.prepare(`
          INSERT INTO master_mapel (id, nama_mapel, kode_mapel, kategori, warna, default_blok, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const m of data.mapel) {
          stmtMapel.run(
            m.id,
            m.nama_mapel,
            m.kode_mapel || m.nama_mapel.substring(0, 4).toUpperCase(),
            m.kategori || 'Reguler',
            m.warna || '#3b82f6',
            m.default_blok || 2,
            new Date().toISOString()
          );
        }
      }

      // 4. Kelas
      if (data.kelas) {
        this.db.exec('DELETE FROM master_kelas;');
        const stmtKelas = this.db.prepare(`
          INSERT INTO master_kelas (id, nama_kelas, tingkat, jurusan, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const k of data.kelas) {
          stmtKelas.run(k.id, k.nama_kelas, k.tingkat || 'X', k.jurusan || 'Umum', new Date().toISOString());
        }
      }

      // 5. Waktu
      if (data.waktu) {
        this.db.exec('DELETE FROM master_waktu;');
        const stmtWaktu = this.db.prepare(`
          INSERT INTO master_waktu (id, hari, sesi_ke, jam_mulai, jam_selesai, is_istirahat, tipe_sesi, label, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const w of data.waktu) {
          stmtWaktu.run(
            w.id,
            w.hari,
            w.sesi_ke,
            w.jam_mulai,
            w.jam_selesai,
            w.is_istirahat ? 1 : 0,
            w.tipe_sesi || (w.is_istirahat ? 'istirahat' : 'belajar'),
            w.label || w.label_khusus || null,
            new Date().toISOString()
          );
        }
      }

      // 6. Plotting
      if (data.plotting) {
        this.db.exec('DELETE FROM plotting_beban;');
        const stmtPlot = this.db.prepare(`
          INSERT INTO plotting_beban (id, kelas_id, guru_id, mapel_id, total_jtm, blok_pertemuan, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const p of data.plotting) {
          stmtPlot.run(
            p.id,
            p.kelas_id,
            p.guru_id,
            p.mapel_id,
            p.total_jtm,
            p.blok_pertemuan ? JSON.stringify(p.blok_pertemuan) : null,
            new Date().toISOString()
          );
        }
      }

      // 7. Jadwal
      if (data.jadwal) {
        this.db.exec('DELETE FROM jadwal_pelajaran;');
        const stmtJadwal = this.db.prepare(`
          INSERT INTO jadwal_pelajaran (id, waktu_id, hari, sesi, kelas_id, mapel_id, guru_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (let i = 0; i < data.jadwal.length; i++) {
          const j = data.jadwal[i];
          stmtJadwal.run(
            j.id || `jadwal-${i + 1}-${Date.now()}`,
            j.waktu_id || `w-${j.hari}-${j.sesi}`,
            j.hari,
            j.sesi,
            j.kelas_id,
            j.mapel_id,
            j.guru_id,
            new Date().toISOString()
          );
        }
      }

      // 8. Piket
      if (data.piket) {
        this.db.exec('DELETE FROM jadwal_piket;');
        const stmtPiket = this.db.prepare(`
          INSERT INTO jadwal_piket (id, hari, guru_id, tugas, lokasi, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const pk of data.piket) {
          stmtPiket.run(pk.id, pk.hari, pk.guru_id, pk.tugas, pk.lokasi || null, new Date().toISOString());
        }
      }

      // 9. Users
      if (data.users && data.users.length > 0) {
        this.db.exec('DELETE FROM users;');
        const stmtUsers = this.db.prepare(`
          INSERT INTO users (id, email, password, nama_lengkap, role, guru_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const u of data.users) {
          stmtUsers.run(
            u.id,
            u.email,
            u.password || 'password123',
            u.nama_lengkap,
            u.role || 'guru',
            u.guru_id || null,
            u.created_at || new Date().toISOString()
          );
        }
      }

      this.db.exec('COMMIT;');
      this.logAudit(
        'SYNC_SAVE',
        `Disimpan: ${data.guru?.length || 0} guru, ${data.mapel?.length || 0} mapel, ${data.kelas?.length || 0} kelas, ${data.jadwal?.length || 0} jadwal`
      );
      return { success: true, message: 'Data berhasil disimpan ke database lokal SQLite!' };
    } catch (err: any) {
      this.db.exec('ROLLBACK;');
      console.error('Error during local SQLite transaction:', err);
      throw err;
    }
  }

  public getSqlDump(dialect: 'mysql' | 'sqlite' | 'postgres' = 'mysql'): string {
    const data = this.getAllData();
    const timestamp = new Date().toISOString();

    let sql = `-- ==============================================================================
-- DATABASE LOKAL SEKOLAH / MADRASAH (${dialect.toUpperCase()})
-- Di-generate otomatis oleh SIM-JADWAL SEKOLAH PINTAR
-- Tanggal: ${timestamp}
-- ==============================================================================\n\n`;

    if (dialect === 'mysql') {
      sql += `CREATE DATABASE IF NOT EXISTS \`${this.config.databaseName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`${this.config.databaseName}\`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABEL MASTER GURU
DROP TABLE IF EXISTS \`master_guru\`;
CREATE TABLE \`master_guru\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`nama_guru\` VARCHAR(150) NOT NULL,
  \`kode_guru\` VARCHAR(20) NOT NULL UNIQUE,
  \`nip\` VARCHAR(30) DEFAULT NULL,
  \`max_jtm\` INT DEFAULT 24,
  \`warna_tag\` VARCHAR(20) DEFAULT '#2563eb',
  \`berhalangan\` JSON DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL MASTER MAPEL
DROP TABLE IF EXISTS \`master_mapel\`;
CREATE TABLE \`master_mapel\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`nama_mapel\` VARCHAR(150) NOT NULL,
  \`kode_mapel\` VARCHAR(20) NOT NULL UNIQUE,
  \`kategori\` VARCHAR(50) DEFAULT 'Reguler',
  \`warna\` VARCHAR(20) DEFAULT '#3b82f6',
  \`default_blok\` INT DEFAULT 2,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABEL MASTER KELAS
DROP TABLE IF EXISTS \`master_kelas\`;
CREATE TABLE \`master_kelas\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`nama_kelas\` VARCHAR(50) NOT NULL UNIQUE,
  \`tingkat\` VARCHAR(20) DEFAULT 'X',
  \`jurusan\` VARCHAR(50) DEFAULT 'Umum',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABEL STRUKTUR WAKTU
DROP TABLE IF EXISTS \`master_waktu\`;
CREATE TABLE \`master_waktu\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`hari\` VARCHAR(20) NOT NULL,
  \`sesi_ke\` INT NOT NULL,
  \`jam_mulai\` VARCHAR(10) NOT NULL,
  \`jam_selesai\` VARCHAR(10) NOT NULL,
  \`is_istirahat\` TINYINT(1) DEFAULT 0,
  \`tipe_sesi\` VARCHAR(30) DEFAULT 'belajar',
  \`label\` VARCHAR(100) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABEL PLOTTING BEBAN MENGAJAR (SKBM)
DROP TABLE IF EXISTS \`plotting_beban\`;
CREATE TABLE \`plotting_beban\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`kelas_id\` VARCHAR(64) NOT NULL,
  \`guru_id\` VARCHAR(64) NOT NULL,
  \`mapel_id\` VARCHAR(64) NOT NULL,
  \`total_jtm\` INT NOT NULL,
  \`blok_pertemuan\` JSON DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TABEL JADWAL PELAJARAN (ANTI-BENTROK)
DROP TABLE IF EXISTS \`jadwal_pelajaran\`;
CREATE TABLE \`jadwal_pelajaran\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`waktu_id\` VARCHAR(64) DEFAULT NULL,
  \`hari\` VARCHAR(20) NOT NULL,
  \`sesi\` INT NOT NULL,
  \`kelas_id\` VARCHAR(64) NOT NULL,
  \`mapel_id\` VARCHAR(64) NOT NULL,
  \`guru_id\` VARCHAR(64) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY \`uk_guru_waktu\` (\`hari\`, \`sesi\`, \`guru_id\`),
  UNIQUE KEY \`uk_kelas_waktu\` (\`hari\`, \`sesi\`, \`kelas_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TABEL JADWAL PIKET
DROP TABLE IF EXISTS \`jadwal_piket\`;
CREATE TABLE \`jadwal_piket\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`hari\` VARCHAR(20) NOT NULL,
  \`guru_id\` VARCHAR(64) NOT NULL,
  \`tugas\` VARCHAR(150) NOT NULL,
  \`lokasi\` VARCHAR(100) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    }

    // Insert statement generation
    if (data.guru.length > 0) {
      sql += `-- INSERT DATA MASTER GURU (${data.guru.length} data)\n`;
      data.guru.forEach((g) => {
        const berhalanganVal = g.berhalangan?.length ? `'${JSON.stringify(g.berhalangan).replace(/'/g, "''")}'` : 'NULL';
        sql += `INSERT INTO master_guru (id, nama_guru, kode_guru, nip, max_jtm, warna_tag, berhalangan) VALUES ('${g.id}', '${g.nama_guru.replace(/'/g, "''")}', '${g.kode_guru}', ${g.nip ? `'${g.nip}'` : 'NULL'}, ${g.max_jtm}, '${g.warna_tag}', ${berhalanganVal});\n`;
      });
      sql += '\n';
    }

    if (data.mapel.length > 0) {
      sql += `-- INSERT DATA MASTER MAPEL (${data.mapel.length} data)\n`;
      data.mapel.forEach((m) => {
        sql += `INSERT INTO master_mapel (id, nama_mapel, kode_mapel, kategori, warna, default_blok) VALUES ('${m.id}', '${m.nama_mapel.replace(/'/g, "''")}', '${m.kode_mapel}', '${m.kategori}', '${m.warna}', ${m.default_blok});\n`;
      });
      sql += '\n';
    }

    if (data.kelas.length > 0) {
      sql += `-- INSERT DATA MASTER KELAS (${data.kelas.length} data)\n`;
      data.kelas.forEach((k) => {
        sql += `INSERT INTO master_kelas (id, nama_kelas, tingkat, jurusan) VALUES ('${k.id}', '${k.nama_kelas}', '${k.tingkat}', '${k.jurusan}');\n`;
      });
      sql += '\n';
    }

    if (data.waktu.length > 0) {
      sql += `-- INSERT STRUKTUR WAKTU KBM (${data.waktu.length} data)\n`;
      data.waktu.forEach((w) => {
        sql += `INSERT INTO master_waktu (id, hari, sesi_ke, jam_mulai, jam_selesai, is_istirahat, tipe_sesi, label) VALUES ('${w.id}', '${w.hari}', ${w.sesi_ke}, '${w.jam_mulai}', '${w.jam_selesai}', ${w.is_istirahat ? 1 : 0}, '${w.tipe_sesi}', ${w.label ? `'${w.label.replace(/'/g, "''")}'` : 'NULL'});\n`;
      });
      sql += '\n';
    }

    if (data.plotting.length > 0) {
      sql += `-- INSERT PLOTTING BEBAN MENGAJAR (${data.plotting.length} data)\n`;
      data.plotting.forEach((p) => {
        const blok = p.blok_pertemuan ? `'${JSON.stringify(p.blok_pertemuan)}'` : 'NULL';
        sql += `INSERT INTO plotting_beban (id, kelas_id, guru_id, mapel_id, total_jtm, blok_pertemuan) VALUES ('${p.id}', '${p.kelas_id}', '${p.guru_id}', '${p.mapel_id}', ${p.total_jtm}, ${blok});\n`;
      });
      sql += '\n';
    }

    if (data.jadwal.length > 0) {
      sql += `-- INSERT JADWAL PELAJARAN AKTIF (${data.jadwal.length} sesi)\n`;
      data.jadwal.forEach((j) => {
        sql += `INSERT INTO jadwal_pelajaran (id, waktu_id, hari, sesi, kelas_id, mapel_id, guru_id) VALUES ('${j.id || 'j-' + Math.random().toString(36).substring(2, 9)}', '${j.waktu_id}', '${j.hari}', ${j.sesi}, '${j.kelas_id}', '${j.mapel_id}', '${j.guru_id}');\n`;
      });
      sql += '\n';
    }

    return sql;
  }

  public async testTcpConnection(host: string, port: number): Promise<{ reachable: boolean; latencyMs: number; error?: string }> {
    return new Promise((resolve) => {
      const start = Date.now();
      const socket = new net.Socket();
      socket.setTimeout(2500);

      socket.on('connect', () => {
        const latency = Date.now() - start;
        socket.destroy();
        resolve({ reachable: true, latencyMs: latency });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ reachable: false, latencyMs: 2500, error: 'Connection timed out (Host atau port tidak merespons dalam 2.5s).' });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({ reachable: false, latencyMs: Date.now() - start, error: err.message });
      });

      socket.connect(port, host);
    });
  }

  public getDbFilePath(): string {
    return this.dbFilePath;
  }
}
