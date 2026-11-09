# Foto GPS — Kamera Geotag & Watermark Lapangan (PWA)

Aplikasi Web & Progressive Web App (PWA) untuk pengambilan dokumentasi foto lapangan dengan watermark otomatis koordinat GPS, alamat lokasi, tanggal, waktu, serta kop instansi (KIP/KPU).

---

## 🌟 Fitur Utama

1. **Watermark Otomatis & Real-Time**:
   - **Kop Instansi**: Logo resmi dan nama instansi (Default: *KIP KABUPATEN ACEH SELATAN*). Bisa diganti logo & nama sendiri lewat menu pengaturan.
   - **Koordinat GPS**: Menampilkan format **Desimal** (`3.250123°, 97.182345°`) dan **DMS** (`3° 15' 0.4" N, 97° 10' 56.4" E`), perkiraan akurasi meter (`±4m`), serta ketinggian (*altitude*).
   - **Alamat Otomatis**: Deteksi nama jalan, kelurahan/desa, kecamatan, dan kabupaten via OpenStreetMap Nominatim.
   - **Waktu & Tanggal Presisi**: Waktu WIB/Lokal dengan penanggalan format Indonesia.
   - **Catatan / Keterangan Cepat**: Kolom input langsung di bawah kamera untuk mencatat nomor TPS, nama desa, atau nama petugas.

2. **Kamera & Rasio Fleksibel**:
   - Pilihan rasio foto: **4:3** (standar), **16:9** (widescreen), dan **1:1** (persegi).
   - Pengalih kamera depan dan belakang (*Rear / Front camera*).
   - Senter / Flashlight toggle (pada perangkat yang mendukung).
   - Garis bantu (*Rule of Thirds Grid*).
   - Fitur **Upload dari Galeri**: foto lama bisa di-upload dan langsung diberi stempel geotag.

3. **Gaya Watermark**:
   - **Kop Dinas & Bar Bawah (Resmi)**: Header instansi bergaris emas elegan di atas, bar informasi GPS di bawah.
   - **Kartu Lapangan (Modern)**: Panel semi-transparan modern dengan aksen emas di sisi bawah.
   - **Minimalis Transparan**: Tulisan dengan bayangan tajam tanpa blok background.

4. **Galeri Riwayat Lokal (IndexedDB)**:
   - Foto yang telah diambil otomatis tersimpan di riwayat aplikasi perangkat Anda.
   - Bisa dilihat kembali, diunduh ulang, atau dihapus kapan saja.

5. **PWA & Offline Ready**:
   - Dapat di-install ke layar utama HP Android / iOS (*Add to Home Screen*).
   - Bekerja secara offline di daerah *blank spot* / tanpa sinyal seluler (jam dan koordinat satelit GPS tetap akurat tercatat).

---

## 🚀 Cara Menjalankan

### Opsi 1: Menjalankan di Komputer / Laptop Lokal
1. Pastikan **Node.js** sudah terpasang.
2. Klik ganda file `start.bat` atau jalankan lewat terminal:
   ```bash
   node server.js
   ```
3. Buka browser dan akses: `http://localhost:3000`

---

### Opsi 2: Penggunaan di HP (Direkomendasikan via HTTPS)
> **PENTING**: Browser modern di HP (Google Chrome, Safari, Samsung Internet) **mewajibkan protokol HTTPS** agar izin Kamera dan Lokasi GPS dapat diaktifkan.

Anda dapat mempublikasikan aplikasi ini secara **gratis** dalam 1 menit:

#### Lewat GitHub Pages (Sangat Mudah):
1. Buat repositori baru di GitHub (misal: `fotogps`).
2. Upload semua file dalam folder ini (`index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`, `logo.png`).
3. Buka menu **Settings** > **Pages** di repositori GitHub.
4. Pada bagian *Branch*, pilih `main` / `root` lalu klik **Save**.
5. Buka link HTTPS yang disediakan (misal: `https://username.github.io/fotogps/`).

#### Cara Install ke Layar Utama HP (PWA):
1. Buka link aplikasi di browser HP (Chrome di Android atau Safari di iPhone).
2. Tekan menu titik tiga `⋮` di Chrome (atau tombol *Share* di Safari).
3. Pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)** / **"Install Aplikasi"**.
4. Aplikasi Foto GPS akan muncul di daftar aplikasi HP Anda seperti aplikasi native.

---

## ⚙️ Struktur File

- [index.html](file:///d:/2026/1.%20PROGRAMMING/KIP/fotogps/index.html) — Halaman antarmuka utama (Viewfinder, kontrol kamera, modal preview & galeri).
- [styles.css](file:///d:/2026/1.%20PROGRAMMING/KIP/fotogps/styles.css) — Desain responsif bertema gelap modern dengan aksen emas kedinasan.
- [app.js](file:///d:/2026/1.%20PROGRAMMING/KIP/fotogps/app.js) — Logika kamera, pelacak GPS, reverse geocoding, rendering watermark canvas resolusi tinggi, dan penyimpanan galeri IndexedDB.
- [manifest.json](file:///d:/2026/1.%20PROGRAMMING/KIP/fotogps/manifest.json) — Konfigurasi PWA untuk instalasi di Android & iOS.
- [sw.js](file:///d:/2026/1.%20PROGRAMMING/KIP/fotogps/sw.js) — Service worker untuk caching dan akses offline.
- [server.js](file:///d:/2026/1.%20PROGRAMMING/KIP/fotogps/server.js) — Server Node.js lokal statis ringan untuk pengujian.
- [start.bat](file:///d:/2026/1.%20PROGRAMMING/KIP/fotogps/start.bat) — Skrip klik ganda untuk menjalankan server lokal di Windows.
- [logo.png](file:///d:/2026/1.%20PROGRAMMING/KIP/fotogps/logo.png) — Logo bawaan instansi (KPU / KIP).
