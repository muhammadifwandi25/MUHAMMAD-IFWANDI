/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Initialize Gemini client utility server-side
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // Scheduling generation via Gemini 3.8 Flash using the exact user-specified system instructions
  app.post('/api/schedule/gemini', async (req, res) => {
    try {
      const { data_guru_dan_ketersediaan, data_kelas_dan_struktur_waktu, plotting_beban_mengajar } =
        req.body;

      if (!ai) {
        return res.status(400).json({
          error:
            'GEMINI_API_KEY belum dikonfigurasi di environment server. Silakan pastikan key sudah terdaftar di Secrets panel atau gunakan Algoritma Heuristik Cepat bawaan.',
        });
      }

      const systemInstruction = `Anda adalah sistem pemroses algoritma penjadwalan sekolah dan madrasah tingkat lanjut. Tugas utama Anda adalah menerima data alokasi mengajar, ketersediaan guru, dan slot waktu, lalu menghasilkan jadwal pelajaran mingguan yang optimal, efisien, dan 100% bebas konflik.

Struktur Data Input (Beban Kerja dari Supabase)
- Data Guru & Ketersediaan: Array JSON berisi ID Guru, batas maksimal jam pelajaran (JTM) mingguan, dan daftar hari/sesi di mana guru tersebut berhalangan.
- Data Kelas & Struktur Waktu: Array JSON berisi ID Kelas dan daftar sesi harian (termasuk flag khusus untuk jam istirahat, upacara, atau ibadah/sholat jamaah).
- Plotting Beban Mengajar: Array JSON berisi pemetaan yang mewajibkan kombinasi ID Kelas, ID Guru, ID Mata Pelajaran, dan total JTM per minggu.

Aturan Penjadwalan (Constraints)
1. Anti-Bentrok (Hard Constraint): Satu ID Guru dan satu ID Kelas hanya boleh beroperasi pada satu mata pelajaran di satu slot waktu (sesi) yang sama.
2. Blok Waktu Berurutan: Jika suatu mata pelajaran dialokasikan lebih dari 1 JTM pada hari yang sama, tempatkan pada sesi yang berurutan. Jangan memotong blok ini dengan jam istirahat kecuali mutlak diperlukan.
3. Pembatasan Ketersediaan: Dilarang menempatkan ID Guru pada slot waktu di mana status ketersediaannya ditandai tidak bisa mengajar.
4. Jangan isi jam istirahat / upacara / sholat jamaah dengan mata pelajaran! (Slot dengan is_istirahat = true tidak boleh diisi).
5. Penyebaran Merata (Soft Constraint): Hindari menempatkan mata pelajaran yang sama pada hari yang berurutan untuk satu kelas jika memungkinkan, dan hindari memberikan jam kosong (jeda) terlalu banyak bagi seorang guru dalam satu hari.

Format Output Target
Anda hanya boleh merespons dengan objek JSON murni tanpa format markdown (tanpa \`\`\`json) dan tanpa kalimat pengantar. Format JSON harus memiliki dua parameter utama:
"jadwal_tersusun": Array berisi objek yang berhasil dijadwalkan dengan atribut hari, sesi, kelas_id, mapel_id, dan guru_id.
"jadwal_gagal": Array berisi data plotting yang gagal menemukan slot karena konflik permanen atau keterbatasan ketersediaan guru, dilengkapi atribut alasan.`;

      const inputPayload = JSON.stringify({
        data_guru_dan_ketersediaan,
        data_kelas_dan_struktur_waktu,
        plotting_beban_mengajar,
      });

      let attempts = 0;
      let lastErr: any = null;
      let rawText = '{}';

      while (attempts < 2) {
        attempts++;
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Berikut adalah data beban kerja, ketersediaan, dan struktur waktu untuk dijadwalkan secara optimal:\n${inputPayload}`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  jadwal_tersusun: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        hari: { type: Type.STRING },
                        sesi: { type: Type.INTEGER },
                        kelas_id: { type: Type.STRING },
                        mapel_id: { type: Type.STRING },
                        guru_id: { type: Type.STRING },
                      },
                      required: ['hari', 'sesi', 'kelas_id', 'mapel_id', 'guru_id'],
                    },
                  },
                  jadwal_gagal: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        kelas_id: { type: Type.STRING },
                        mapel_id: { type: Type.STRING },
                        guru_id: { type: Type.STRING },
                        jtm: { type: Type.INTEGER },
                        alasan: { type: Type.STRING },
                      },
                      required: ['kelas_id', 'mapel_id', 'guru_id', 'alasan'],
                    },
                  },
                },
                required: ['jadwal_tersusun', 'jadwal_gagal'],
              },
            },
          });

          rawText = response.text || '{}';
          break;
        } catch (err: any) {
          lastErr = err;
          if (attempts < 2) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
      }

      if (rawText === '{}' && lastErr) {
        throw lastErr;
      }

      const parsedData = JSON.parse(rawText);

      return res.json({
        success: true,
        data: parsedData,
        raw_text: rawText,
      });
    } catch (error: any) {
      console.error('Error generating schedule via Gemini:', error);
      let userFriendlyMsg = error?.message || 'Gagal memproses penjadwalan via Gemini AI';
      if (typeof userFriendlyMsg === 'string' && userFriendlyMsg.includes('503')) {
        userFriendlyMsg = 'Model Gemini sedang mengalami lonjakan antrean sementara (503). Anda dapat mencoba kembali beberapa saat lagi atau beralih ke Algoritma Heuristik Cepat untuk penjadwalan instan.';
      }
      return res.status(500).json({
        error: userFriendlyMsg,
      });
    }
  });

  // Supabase Configuration
  const defaultSupabaseUrl = process.env.SUPABASE_URL || 'https://obpgeccazckossgulqom.supabase.co';
  const defaultAnonKey = process.env.SUPABASE_ANON_KEY || '';

  // Get Supabase configuration status
  app.get('/api/supabase/config', (_req, res) => {
    res.json({
      supabaseUrl: defaultSupabaseUrl,
      projectRef: 'obpgeccazckossgulqom',
      restEndpoint: `${defaultSupabaseUrl.replace(/\/$/, '')}/rest/v1/`,
      hasKey: Boolean(defaultAnonKey),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Test connection to Supabase REST API
  app.post('/api/supabase/test', async (req, res) => {
    try {
      const url = req.body.url || defaultSupabaseUrl;
      const apiKey = req.body.apiKey || defaultAnonKey;

      if (!apiKey) {
        return res.json({
          success: false,
          reachable: true,
          authenticated: false,
          message: 'Endpoint Supabase aktif dan terhubung, namun memerlukan API Key (anon public key dari Supabase Dashboard > Settings > API).',
        });
      }

      // Test query to master_guru table
      const testRes = await fetch(`${url.replace(/\/$/, '')}/rest/v1/master_guru?select=count`, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (testRes.status === 200 || testRes.status === 206) {
        return res.json({
          success: true,
          reachable: true,
          authenticated: true,
          schemaDeployed: true,
          message: 'Koneksi ke Supabase berhasil! Tabel master data aktif dan siap disinkronisasi.',
        });
      }

      if (testRes.status === 404) {
        return res.json({
          success: true,
          reachable: true,
          authenticated: true,
          schemaDeployed: false,
          message: 'Koneksi API Key valid, namun tabel master belum ditemukan. Silakan jalankan skrip supabase_schema.sql di Supabase SQL Editor.',
        });
      }

      const errText = await testRes.text();
      return res.json({
        success: false,
        reachable: true,
        authenticated: false,
        status: testRes.status,
        message: `Respons Supabase (${testRes.status}): ${errText}`,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        reachable: false,
        message: err.message || 'Gagal menghubungi server Supabase.',
      });
    }
  });

  // Fetch all tables directly from live Supabase instance
  app.get('/api/supabase/data', async (req, res) => {
    try {
      const apiKey = (req.headers['x-supabase-key'] as string) || (req.query.apiKey as string) || defaultAnonKey;
      const targetUrl = (req.query.url as string) || defaultSupabaseUrl;

      if (!apiKey) {
        return res.json({
          success: false,
          hasKey: false,
          message: 'Supabase API Key belum dikonfigurasi. Masukkan Anon Key di menu Supabase Integration untuk menarik data langsung dari cloud.',
          data: null,
        });
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(targetUrl, apiKey);

      const [guruRes, mapelRes, kelasRes, waktuRes, plottingRes, jadwalRes, profilesRes] = await Promise.all([
        supabase.from('master_guru').select('*').order('created_at', { ascending: true }),
        supabase.from('master_mapel').select('*').order('created_at', { ascending: true }),
        supabase.from('master_kelas').select('*').order('tingkat', { ascending: true }),
        supabase.from('master_waktu').select('*').order('sesi_ke', { ascending: true }),
        supabase.from('plotting_beban').select('*'),
        supabase.from('jadwal_pelajaran').select('*'),
        supabase.from('profiles').select('*'),
      ]);

      const hasAnyData =
        (guruRes.data && guruRes.data.length > 0) ||
        (mapelRes.data && mapelRes.data.length > 0) ||
        (kelasRes.data && kelasRes.data.length > 0);

      return res.json({
        success: true,
        hasKey: true,
        hasData: hasAnyData,
        data: {
          guru: guruRes.data || [],
          mapel: mapelRes.data || [],
          kelas: kelasRes.data || [],
          waktu: waktuRes.data || [],
          plotting: plottingRes.data || [],
          jadwal: jadwalRes.data || [],
          profiles: profilesRes.data || [],
        },
        errors: {
          guru: guruRes.error?.message,
          mapel: mapelRes.error?.message,
          kelas: kelasRes.error?.message,
          waktu: waktuRes.error?.message,
          plotting: plottingRes.error?.message,
          jadwal: jadwalRes.error?.message,
          profiles: profilesRes.error?.message,
        },
      });
    } catch (err: any) {
      console.error('Error fetching data from Supabase:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Gagal mengambil data dari Supabase.',
      });
    }
  });

  // Push local schedule and master data directly to Supabase tables
  app.post('/api/supabase/sync-push', async (req, res) => {
    try {
      const { guru, mapel, kelas, waktu, plotting, jadwal, apiKey } = req.body;
      const keyToUse = apiKey || defaultAnonKey;

      if (!keyToUse) {
        return res.status(400).json({
          error: 'API Key Supabase diperlukan untuk sinkronisasi online.',
        });
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(defaultSupabaseUrl, keyToUse);

      const results: Record<string, any> = {};

      // 1. Push Kelas
      if (kelas && kelas.length > 0) {
        const { error: errK } = await supabase.from('master_kelas').upsert(
          kelas.map((k: any) => ({
            id: k.id.length > 30 ? k.id : undefined, // only if UUID
            nama_kelas: k.nama_kelas,
            tingkat: k.tingkat,
            jurusan: k.jurusan || 'Umum',
          })),
          { onConflict: 'nama_kelas' }
        );
        results.kelas = errK ? `Error: ${errK.message}` : 'Berhasil disinkronkan';
      }

      // 2. Push Mapel
      if (mapel && mapel.length > 0) {
        const { error: errM } = await supabase.from('master_mapel').upsert(
          mapel.map((m: any) => ({
            nama_mapel: m.nama_mapel,
            kode_mapel: m.kode_mapel,
            kategori: m.kategori,
            default_blok: m.default_blok || 2,
            warna: m.warna || '#3b82f6',
          })),
          { onConflict: 'kode_mapel' }
        );
        results.mapel = errM ? `Error: ${errM.message}` : 'Berhasil disinkronkan';
      }

      // 3. Push Guru
      if (guru && guru.length > 0) {
        const { error: errG } = await supabase.from('master_guru').upsert(
          guru.map((g: any) => ({
            nama_guru: g.nama_guru,
            kode_guru: g.kode_guru,
            nip: g.nip || null,
            max_jtm: g.max_jtm || 24,
            warna_tag: g.warna_tag || '#2563eb',
          })),
          { onConflict: 'kode_guru' }
        );
        results.guru = errG ? `Error: ${errG.message}` : 'Berhasil disinkronkan';
      }

      return res.json({
        success: true,
        message: 'Data berhasil disinkronisasikan ke Supabase!',
        details: results,
      });
    } catch (err: any) {
      console.error('Error syncing to Supabase:', err);
      return res.status(500).json({
        error: err.message || 'Terjadi kesalahan saat menyinkronkan data ke Supabase.',
      });
    }
  });

  // Mount Vite or static file serving
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
