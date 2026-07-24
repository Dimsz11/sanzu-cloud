# WA Bot Manager

Dashboard multi-bot WhatsApp berbasis Next.js dengan pairing code authentication.

## Fitur
- ✅ Tambah & hapus bot
- ✅ Koneksi via **Pairing Code** (tanpa scan QR)
- ✅ Kirim pesan dari dashboard
- ✅ Monitor status & statistik pesan real-time
- ✅ Multi-bot support

## Cara Deploy ke Vercel

### 1. Clone / upload project ini ke GitHub

### 2. Import ke Vercel
- Buka [vercel.com](https://vercel.com) → New Project
- Pilih repo GitHub kamu
- Framework: **Next.js** (auto-detect)
- Klik Deploy

### 3. Selesai!

---

## Cara Pakai

1. **Tambah Bot** → isi nama → klik "+ Tambah"
2. **Hubungkan** → klik "🔗 Hubungkan" → masukkan nomor WA format internasional (contoh: `628123456789`)
3. **Salin Pairing Code** yang muncul di kartu bot
4. Di HP → WhatsApp → **Perangkat Tertaut** → Tautkan Perangkat → **Masukkan Kode**
5. Bot otomatis online ✅

## Catatan Penting

> ⚠️ **State bot disimpan di memori server** — reset kalau Vercel cold start.
> Untuk production, integrasikan Redis (Upstash) atau database untuk persistensi session.

### Upgrade ke Persistent Auth
Ganti `useMultiFileAuthState('/tmp/auth_...')` dengan implementasi berbasis database.
Rekomendasi: **Upstash Redis** (gratis, mudah diintegrasikan dengan Vercel).

## Tech Stack
- **Next.js 14** (Pages Router)
- **@whiskeysockets/baileys** — WhatsApp Web API
- **TypeScript**
