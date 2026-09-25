# 🌐 NMS-NOC (Network Management System) - Knowledge Base & Technical Documentation

> **Dokumentasi Lengkap Arsitektur, Basis Data, API, Integrasi SNMP MikroTik, dan Panduan Sinkronisasi CI/CD VPS.**  
> Dokumen ini dirancang sebagai acuan terpusat (*Knowledge Base*) untuk memudahkan pengembangan, pemeliharaan, serta sinkronisasi kode antara komputer lokal (laptop kantor / PC rumah) dan server VPS produksi.

---

## 📑 Daftar Isi
1. [Ringkasan Proyek & Arsitektur Sistem](#1-ringkasan-proyek--arsitektur-sistem)
2. [Tech Stack & Dependensi Utama](#2-tech-stack--dependensi-utama)
3. [Struktur Direktori Proyek](#3-struktur-direktori-proyek)
4. [Arsitektur Basis Data (PostgreSQL & Drizzle ORM)](#4-arsitektur-basis-data-postgresql--drizzle-orm)
5. [Modul & Fitur Utama NMS](#5-modul--fitur-utama-nms)
   - [5.1 NOC Live Dashboard](#51-noc-live-dashboard)
   - [5.2 Manajemen Perangkat & Telemetri Hardware](#52-manajemen-perangkat--telemetri-hardware)
   - [5.3 Peta Topologi & Denah Gedung (Interactive Canvas)](#53-peta-topologi--denah-gedung-interactive-canvas)
   - [5.4 Manajemen Bandwidth (MikroTik Simple Queue)](#54-manajemen-bandwidth-mikrotik-simple-queue)
   - [5.5 Sistem Alert, Aturan Ambang Batas & Notifikasi](#55-sistem-alert-aturan-ambang-batas--notifikasi)
   - [5.6 Tiket Pemeliharaan & Riwayat Perbaikan](#56-tiket-pemeliharaan--riwayat-perbaikan)
   - [5.7 Subnet Auto-Discovery](#57-subnet-auto-discovery)
   - [5.8 Laporan & Analisis Kapasitas SLA](#58-laporan--analisis-kapasitas-sla)
   - [5.9 AI Network Optimizer](#59-ai-network-optimizer)
   - [5.10 Audit Log & Keamanan Akses](#510-audit-log--keamanan-akses)
6. [Panduan Integrasi SNMP & MikroTik RouterOS](#6-panduan-integrasi-snmp--mikrotik-routeros)
7. [Dokumentasi API Endpoints & Client SDK](#7-dokumentasi-api-endpoints--client-sdk)
8. [Panduan Deployment, VPS & CI/CD Workflow](#8-panduan-deployment-vps--cicd-workflow)
   - [8.1 Alur CI/CD GitHub Actions](#81-alur-cicd-github-actions)
   - [8.2 Manajemen Proses PM2 di VPS](#82-manajemen-proses-pm2-di-vps)
   - [8.3 Panduan Sinkronisasi Laptop Kantor / PC Rumah](#83-panduan-sinkronisasi-laptop-kantor--pc-rumah)
9. [Perintah Pengujian & Quality Assurance (QA)](#9-perintah-pengujian--quality-assurance-qa)

---

## 1. Ringkasan Proyek & Arsitektur Sistem

**NMS-NOC** adalah aplikasi *Enterprise Network Management System* modern yang dirancang untuk tim Network Operation Center (NOC) dan IT Support. Aplikasi ini menyediakan pemantauan metrik jaringan real-time, visualisasi topologi, manajemen bandwidth QoS Simple Queue, manajemen tiket perbaikan, audit trail keamanan, serta engine rekomendasi AI Optimizer.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15 / React 19)                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ M3 Theme & UI   │  │ Zustand / React  │  │ Recharts Live Visual  │  │
│  │ Components      │  │ Store (store.tsx)│  │ & Topology Canvas     │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON API Fetch
┌───────────────────────────────────▼────────────────────────────────────┐
│                     BACKEND (Next.js Route Handlers)                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ Better Auth v1  │  │ SNMP Worker &    │  │ AI Optimizer Engine   │  │
│  │ RBAC Session    │  │ Poller (net-snmp)│  │ (Gemini / Claude / etc│  │
│  └─────────────────┘  └──────────────────┘  └───────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Drizzle ORM (PostgreSQL Driver)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    DATABASE (PostgreSQL 16 Engine)                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 23 Tabel Relasional: devices, queue_traffics, alerts, users, dll.│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack & Dependensi Utama

| Kategori | Teknologi | Deskripsi / Fungsi |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.1.7 (App Router) | Full-stack React framework dengan Server & Client Components |
| **Runtime & UI** | React 19.0.0, TypeScript 5.7 | Bahasa bertipe ketat dengan performa concurrency React 19 |
| **Styling & Design** | Tailwind CSS 3.4, Material Design 3 | Sistem token M3 (Primary, Surface, Container, On-Surface) |
| **Visualisasi Data** | Recharts 2.15.1, Lucide Icons | Grafik throughput time-series dinamis, gauge SLA, dan ikon vektor |
| **Database & ORM** | PostgreSQL 16, Drizzle ORM 0.45, Drizzle Kit | Type-safe ORM dengan migrasi otomatis (`drizzle-kit push`) |
| **Autentikasi** | Better Auth 1.7.1 | Autentikasi berbasis session token, cookie aman & proteksi RBAC |
| **Protokol Jaringan** | `net-snmp` 3.26.3 | Polling SNMP v2c / v3 untuk CPU, RAM, Suhu, Bandwidth & Uptime |
| **Process Manager** | PM2 | Daemon process manager untuk zero-downtime reload di VPS |
| **CI / CD** | GitHub Actions (`self-hosted` runner) | Otomasi build, push skema database, dan restart service di VPS |

---

## 3. Struktur Direktori Proyek

```bash
NMS-NOC/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Pipeline CI/CD GitHub Actions ke Server VPS
├── drizzle/                      # File snapshot dan migrasi Drizzle ORM SQL
├── scripts/
│   ├── clear-db.ts               # Script truncate data pengujian
│   ├── db-migrate.cjs            # Script eksekusi migrasi database
│   ├── init-db.ts                # Inisialisasi database dan akun admin awal
│   ├── setup-db.ts               # Pembuatan database PostgreSQL lokal
│   └── test-integration.ts       # Test runner pengujian integrasi 40 endpoint
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Rute autentikasi (/login, /forgot-password)
│   │   ├── (dashboard)/          # Halaman Dashboard NOC
│   │   │   ├── alerts/           # Halaman manajemen alert & aturan
│   │   │   ├── audit/            # Halaman audit log keamanan
│   │   │   ├── devices/          # Halaman daftar perangkat & detail [id]
│   │   │   ├── map/              # Halaman peta topologi denah lantai
│   │   │   ├── optimizer/        # Halaman AI Network Optimizer
│   │   │   ├── repairs/          # Halaman tiket perbaikan & pemeliharaan
│   │   │   ├── reports/          # Halaman laporan SLA & kapasitas
│   │   │   ├── settings/         # Halaman konfigurasi sistem & profil
│   │   │   ├── topology/         # Halaman visualisasi graf topologi jaringan
│   │   │   └── users/            # Halaman manajemen pengguna & role RBAC
│   │   └── api/                  # 20+ REST API Route Handlers backend
│   ├── components/               # Komponen Modular React
│   │   ├── dashboard/            # Widget NOC: LiveThroughputChart, QueueTrafficChart, dll.
│   │   ├── devices/              # Modal Add/Edit perangkat, detail sheet
│   │   ├── layout/               # Header, Sidebar navigasi M3, Profile menu
│   │   ├── m3/                   # Reusable M3 primitives (Button, Card, Dialog, TextField)
│   │   ├── map/                  # Canvas interaktif denah lantai
│   │   ├── optimizer/            # Card konfigurasi AI, kartu rekomendasi rute
│   │   └── topology/             # Graph canvas interaktif dengan drag & drop
│   ├── db/
│   │   ├── index.ts              # Konfigurasi koneksi PostgreSQL driver
│   │   ├── schema.ts             # Definisi 23 tabel PostgreSQL Drizzle
│   │   └── seed.ts               # Data seed awal (User Admin & Default Site)
│   └── lib/
│       ├── api-client.ts         # Wrapper fetch API terpusat (`nmsApi`)
│       ├── auth.ts               # Inisialisasi Better Auth backend
│       ├── auth-client.ts        # Client library Better Auth
│       ├── m3-theme.ts           # Token warna Material Design 3
│       ├── mikrotik-exporter.ts  # Parser dan pengambil data RouterOS
│       ├── snmp-poller.ts        # Modul polling SNMP v2c/v3
│       ├── store.tsx             # Global State & Context Provider aplikasi
│       ├── types.ts              # TypeScript interfaces & types lengkap
│       └── utils.ts              # Utility helper format data & Mbps
├── drizzle.config.ts             # Konfigurasi Drizzle Kit
├── ecosystem.config.cjs          # Konfigurasi PM2 Process Manager
├── next.config.ts                # Konfigurasi Next.js Compiler
├── package.json                  # Script npm dan daftar dependensi
├── tailwind.config.ts            # Konfigurasi Tailwind & palet Material 3
└── NMS.md                        # Dokumen Knowledge Base ini
```

---

## 4. Arsitektur Basis Data (PostgreSQL & Drizzle ORM)

Skema database didefinisikan pada [`src/db/schema.ts`](file:///d:/Project%20CI-CD/NMS-NOC/src/db/schema.ts) menggunakan Drizzle ORM PostgreSQL dialect:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              LOCATIONS                                 │
│  id (PK), name, building, floor, description, device_count             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 1:N (location_id)
┌───────────────────────────────────▼────────────────────────────────────┐
│                               DEVICES                                  │
│  id (PK), name, type, ip_address, mac_address, model, location_id (FK),│
│  status, uptime, cpu_usage, ram_usage, temp, latency, packet_loss,     │
│  coord_x, coord_y, snmp_version, snmp_community                        │
└─────────┬─────────────────────────┬──────────────────────────┬─────────┘
          │ 1:N                     │ 1:N                      │ 1:N
┌─────────▼──────────────┐ ┌────────▼─────────────┐ ┌──────────▼─────────┐
│   DEVICE_INTERFACES    │ │    QUEUE_TRAFFICS    │ │    VPN_TUNNELS     │
│ device_id (FK), name,  │ │ device_id (FK), name,│ │ device_id (FK),    │
│ speed, rx_bytes, tx... │ │ target, max_limit... │ │ user, remote_ip... │
└────────────────────────┘ └──────────────────────┘ └────────────────────┘
```

### Ringkasan 23 Tabel Relasional:
1. **`user`**: Data identitas personel (nama, email, role `admin` / `petugas`, status, avatar).
2. **`session`** & **`account`**: Manajemen token sesi login dan kredensial password Better Auth.
3. **`verification`**: Token verifikasi email dan reset kata sandi.
4. **`locations`**: Data lokasi fisik jaringan (Gedung, Lantai, Deskripsi Ruang Server).
5. **`devices`**: Perangkat jaringan terdaftar (Router, Switch, Access Point, Server, Firewall) beserta koordinat kanvas topologi (`coordX`, `coordY`).
6. **`device_interfaces`**: Port Ethernet, SFP, WLAN, Bridge dengan metrik RX/TX bytes dan error counters.
7. **`queue_traffics`**: Antrean bandwidth MikroTik Simple Queue (Target subnet, Max Limit UL/DL, Packet drops).
8. **`vpn_tunnels`**: Terowongan VPN aktif (WireGuard, L2TP, IPsec, OpenVPN, PPTP).
9. **`device_metrics`**: Log historis time-series CPU, RAM, Latensi, dan Packet Loss.
10. **`alerts`**: Log insiden alarm (Severity: `critical`, `high`, `medium`, `low`, status Acknowledged / Resolved).
11. **`alert_rules`**: Aturan otomatisasi pemicu alarm berdasarkan batas metrik.
12. **`repair_records`**: Tiket pemeliharaan teknis perangkat dengan kode unik tiket (`TCK-YYYYMMDD-XXXX`).
13. **`report_schedules`**: Jadwal otomatisasi pembuatan laporan SLA dan kapasitas harian/bulanan.
14. **`audit_logs`**: Rekaman audit jejak aktivitas pengguna untuk kepatuhan tata kelola IT.
15. **`auto_discovered_devices`**: Hasil pemindaian subnet (IP, MAC, perkiraan vendor, status `pending` / `approved`).
16. **`ai_configs`**: Konfigurasi model LLM (Gemini, Claude, DeepSeek, OpenAI) & parameter inferensi AI.
17. **`ai_log_anomalies`**: Temuan anomali log RouterOS hasil inferensi AI Engine.
18. **`lan_route_recommendations`**: Rekomendasi jalur rute alternatif untuk mengurai bottleneck.
19. **`device_optimization_plans`**: Skrip RouterOS siap pakai hasil rekomendasi optimasi AI.
20. **`notifications`**: Inbox pemberitahuan untuk pengguna.
21. **`snmp_configs`**: Konfigurasi parameter polling SNMP per perangkat.
22. **`device_status_history`**: Riwayat perubahan status ketersediaan node (`online` ↔ `offline`).
23. **`ai_simulations`**: Metrik proyeksi performa jaringan sebelum dan sesudah optimasi AI.

---

## 5. Modul & Fitur Utama NMS

### 5.1 NOC Live Dashboard
- **Global Stat Cards**: Menghitung secara dinamis total node terdaftar, node *Online*, node *Warning*, node *Offline*, dan SLA ketersediaan bulanan (%).
- **Grafik Throughput Real-Time (Grafana Style)**:
  - Visualisasi kurva download (RX) dan upload (TX) dengan rentang waktu dinamis: **15 Menit**, **1 Jam**, **6 Jam**, **24 Jam**, dan **7 Hari**.
  - Sumbu X dan label interval waktu tersinkronisasi otomatis penuh tanpa gap kosong.
  - Saat sistem baru dipasang (0 node), grafik beralih ke mode **Standby State (0 Mbps)** dengan instruksi penambahan perangkat.

### 5.2 Manajemen Perangkat & Telemetri Hardware
- CRUD perangkat lengkap dengan validasi integritas *Foreign Key*.
- Indikator visual beban CPU, penggunaan RAM, kapasitas storage, suhu board (°C), latensi ping (ms), dan persentase packet loss.
- Tombol **Uji Koneksi Ping** langsung dari dashboard untuk memverifikasi respon latensi dan packet loss ICMP.

### 5.3 Peta Topologi & Denah Gedung (Interactive Canvas)
- Kanvas grafis interaktif dengan dukungan *Drag & Drop*, *Zoom In/Out*, dan *Pan View*.
- Posisi koordinat setiap node otomatis tersimpan ke kolom `coord_x` dan `coord_y` di PostgreSQL secara permanen.
- Filter visual berdasarkan lokasi gedung dan lantai.

### 5.4 Manajemen Bandwidth (MikroTik Simple Queue)
- Integrasi antrean Simple Queue dari RouterOS MikroTik.
- Membaca target subnet/interface (contoh: `0.0.0.0/0`, `ether2`, `wlan1`), batasan Max Limit, serta trafik real-time RX/TX.
- Dilengkapi tombol sinkronisasi instan (🔄) dan modal dialog penambahan Simple Queue baru secara manual.

### 5.5 Sistem Alert, Aturan Ambang Batas & Notifikasi
- Pelacakan insiden jaringan berbasis tingkat keparahan (*Critical*, *High*, *Medium*, *Low*).
- Alur penanganan terstandarisasi: **Acknowledge** (Konfirmasi penanganan oleh operator) dan **Resolve** (Penyelesaian dengan catatan teknis).
- Generator aturan (*Alert Rules*) otomatis berdasarkan kondisi metrik (misal: CPU > 85%, Latensi > 50ms, Packet Loss > 5%).

### 5.6 Tiket Pemeliharaan & Riwayat Perbaikan
- Manajemen siklus hidup perbaikan hardware/software (Status: *Pending*, *In Progress*, *Completed*).
- Pembuatan kode tiket otomatis dengan format `TCK-[TIMESTAMP]-[RANDOM]`.

### 5.7 Subnet Auto-Discovery & Vendor Fingerprinting Engine
- **Multi-Subnet Preset Scanner**: Preset siap pakai untuk `192.168.100.0/24` (Server Farm & Proxmox), `192.168.3.0/24` (R&D & Office LAN), `192.168.2.0/24` (Produksi), `172.31.1.0/24` (CCTV Security), dan `all` (Seluruh range VLAN/Subnet), serta input custom CIDR.
- **Deep MAC OUI & SNMP Vendor Fingerprinting**: Klasifikasi otomatis 80+ vendor jaringan ternama (Ruijie/Reyee, MikroTik, Cisco, Ubiquiti UniFi, Proxmox VE/QEMU, Dell PowerEdge, Hikvision/Dahua CCTV, TP-Link, Synology, IoT Espressif/Sundaya) beserta tipe perangkat (`router`, `switch`, `access_point`, `server`).
- **MikroTik DHCP Leases & MNDP Hostname Correlation**: Mengintegrasikan nama hostname asli perangkat dari tabel DHCP lease RouterOS.
- **1-Click Onboard ke Peta Topologi (`/map`)**: Saat tombol *Setujui & Pantau* atau *Setujui Semua Terpilih* diklik, perangkat otomatis didaftarkan ke PostgreSQL `devices` & `device_interfaces`, dihitung koordinat kanvas topologinya, dihubungkan ke root router (`parent_device_id`), dan langsung muncul di visualisasi peta topologi interaktif.
- **Batch Operations & Export**: Multi-select checkbox, batch approve/ignore, filter status (Baru, Disetujui, Diabaikan, SNMP Ready), serta ekspor data ke CSV/JSON.

### 5.8 Laporan & Analisis Kapasitas SLA
- Analisis tren kapasitas bandwidth dan tren utilitas bulanan.
- Jadwal pembuatan laporan otomatis berbasis format PDF/Excel secara berkala.

### 5.9 AI Network Optimizer
- Dukungan konfigurasi multi-provider: Google Gemini (`gemini-1.5-pro`, `gemini-1.5-flash`), Anthropic Claude (`claude-3-5-sonnet`), DeepSeek (`deepseek-chat`), OpenAI (`gpt-4o`), dan Local LLM (Ollama).
- Menganalisis anomali log RouterOS, menghasilkan rekomendasi optimasi rute LAN, dan menyediakan skrip konfigurasi RouterOS yang dapat dieksekusi dalam 1 klik.

### 5.10 Audit Log & Keamanan Akses
- Pencatatan seluruh aktivitas penting (penambahan perangkat, modifikasi aturan alert, perubahan role user, dll.) beserta timestamp dan IP pelaksana.
- Hak akses bertingkat: **Admin** (Akses penuh ke seluruh konfigurasi) dan **Petugas** (Akses monitoring dan pemeliharaan operasional).

---

## 6. Panduan Integrasi SNMP & MikroTik RouterOS

Untuk mengaktifkan pembacaan metrik dari router MikroTik ke aplikasi NMS:

### 1. Konfigurasi SNMP pada MikroTik (via WinBox / Terminal)
Jalankan perintah berikut di Terminal RouterOS MikroTik Anda:

```routeros
# 1. Aktifkan service SNMP
/snmp set enabled=yes contact="admin@kantor.go.id" location="Ruang Server" trap-version=2

# 2. Tambahkan Community String untuk NMS
/snmp community add name=public addresses=0.0.0.0/0 read-access=yes write-access=no

# 3. Verifikasi konfigurasi
/snmp print
/snmp community print
```

### 2. OID MIB Penting MikroTik
NMS-NOC memanfaatkan Standard MIB dan MikroTik Enterprise MIB (`1.3.6.1.4.1.14988`):
- **CPU Load**: `.1.3.6.1.2.1.25.3.3.1.2.1`
- **Total RAM / Used RAM**: `.1.3.6.1.2.1.25.2.3.1.5` / `.1.3.6.1.2.1.25.2.3.1.6`
- **Suhu Board / Voltage**: `.1.3.6.1.4.1.14988.1.1.3.10.0` / `.1.3.6.1.4.1.14988.1.1.3.8.0`
- **Uptime Router**: `.1.3.6.1.2.1.1.3.0`
- **Interface RX / TX Octets**: `.1.3.6.1.2.1.2.2.1.10` / `.1.3.6.1.2.1.2.2.1.16`
- **Simple Queue Table**: `.1.3.6.1.4.1.14988.1.1.2.1`

---

## 7. Dokumentasi API Endpoints & Client SDK

Seluruh endpoint backend mengembalikan response JSON terstandarisasi `{ success: boolean, data?: any, error?: string }`:

| Method | Endpoint | Fungsi |
| :--- | :--- | :--- |
| `GET` | `/api/stats` | Mengambil ringkasan penghitung perangkat, status online/offline, SLA %, dan total throughput |
| `GET` / `POST` | `/api/devices` | Mengambil daftar semua perangkat / Mendaftarkan perangkat baru |
| `GET` / `PUT` / `DELETE` | `/api/devices/[id]` | Mengambil detail, memperbarui konfigurasi, atau menghapus perangkat |
| `POST` | `/api/devices/[id]/ping` | Menjalankan simulasi ping ICMP (latensi dan loss rate) |
| `GET` / `POST` | `/api/queues` | Mengambil daftar Simple Queue MikroTik / Menambahkan queue baru |
| `GET` / `POST` | `/api/locations` | Mengambil daftar lokasi gedung & lantai / Membuat lokasi baru |
| `GET` / `POST` | `/api/alerts` | Mengambil daftar alarm aktif / Memicu alarm baru |
| `POST` | `/api/alerts/[id]/acknowledge`| Menandai alarm telah dikonfirmasi oleh operator |
| `POST` | `/api/alerts/[id]/resolve` | Menyelesaikan alarm disertai catatan teknis perbaikan |
| `GET` / `POST` | `/api/alert-rules` | Mengambil daftar aturan ambang batas / Membuat aturan baru |
| `GET` / `POST` | `/api/repairs` | Mengambil riwayat perbaikan / Membuat tiket perbaikan baru |
| `GET` / `POST` | `/api/reports` | Mengambil riwayat kapasitas & SLA / Menjadwalkan laporan otomatis |
| `GET` | `/api/topology` | Mengambil struktur node dan tautan edge topologi jaringan |
| `GET` / `POST` / `PUT` | `/api/discovery` | Mengambil hasil scan / Memulai subnet sweep / Approve perangkat baru |
| `GET` / `POST` / `PUT` / `DELETE`| `/api/users` | Manajemen pengguna, role akses, status aktif/nonaktif |
| `GET` / `POST` | `/api/audit-logs` | Mengambil riwayat audit log keamanan / Mencatat aktivitas baru |
| `GET` / `POST` | `/api/optimizer` | Mengambil rekomendasi AI / Menjalankan deep inspection AI scan |
| `POST` | `/api/optimizer/apply` | Menerapkan rekomendasi optimasi rute LAN atau skrip RouterOS |
| `GET` / `PUT` | `/api/optimizer/config`| Mengambil konfigurasi model AI / Menguji koneksi provider LLM |

### Penggunaan SDK Client (`nmsApi`)
Di komponen frontend, gunakan [`src/lib/api-client.ts`](file:///d:/Project%20CI-CD/NMS-NOC/src/lib/api-client.ts) yang telah membungkus seluruh endpoint di atas:

```typescript
import { nmsApi } from '@/lib/api-client';

// Contoh: Mengambil perangkat dan antrean queue
const devices = await nmsApi.getDevices();
const queues = await nmsApi.getQueues();
```

---

## 8. Panduan Deployment, VPS & CI/CD Workflow

### 8.1 Alur CI/CD GitHub Actions
Repository telah dilengkapi konfigurasi deployment otomatis pada [`.github/workflows/deploy.yml`](file:///d:/Project%20CI-CD/NMS-NOC/.github/workflows/deploy.yml).

Setiap kali Anda melakukan `git push origin main`:
1. Runner `self-hosted` di server VPS akan otomatis aktif.
2. Melakukan checkout kode terbaru dan instalasi dependensi (`npm ci`).
3. Mengaplikasikan migrasi skema database terbaru (`npx drizzle-kit push`).
4. Menjalankan proses kompilasi produksi Next.js (`npm run build`).
5. Melakukan zero-downtime restart pada service PM2 (`pm2 reload ecosystem.config.cjs`).

### 8.2 Manajemen Proses PM2 di VPS
Untuk memantau aplikasi di server VPS:

```bash
# Melihat status aplikasi
pm2 status

# Melihat log aplikasi secara real-time
pm2 logs nms-noc

# Merestart aplikasi secara manual
pm2 restart ecosystem.config.cjs --env production

# Menyimpan konfigurasi startup PM2
pm2 save
```

### 8.3 Panduan Sinkronisasi Laptop Kantor / PC Rumah
Agar pekerjaan coding Anda selalu tersinkronisasi tanpa konflik:

#### A. Saat Mulai Bekerja di Laptop Kantor / PC Baru:
```bash
# 1. Masuk ke folder proyek
cd /path/to/NMS-NOC

# 2. Tarik update kode terbaru dari repository GitHub
git pull origin main

# 3. Pasang dependensi terbaru (jika ada package baru)
npm install

# 4. Sinkronkan skema database lokal PostgreSQL Anda
npm run db:push

# 5. Jalankan server pengembangan
npm run dev
```

#### B. Setelah Selesai Melakukan Perubahan Kode:
```bash
# 1. Pastikan seluruh pengujian integrasi lulus 100%
npm run test:integration

# 2. Pastikan build Next.js tidak memiliki error tipe
npm run build

# 3. Stage dan Commit perubahan Anda
git add .
git commit -m "feat(module): deskripsi perubahan fitur yang ditambahkan"

# 4. Push ke branch main (otomatis memicu CI/CD ke VPS)
git push origin main
```

---

## 9. Perintah Pengujian & Quality Assurance (QA)

| Perintah | Fungsi | Target Hasil |
| :--- | :--- | :--- |
| `npm run test:integration` | Menjalankan 40 skenario pengujian otomatis untuk seluruh endpoint backend | `40/40 Skenario PASS (100%)` |
| `npm run build` | Melakukan verifikasi linting, type-checking, dan prerender Next.js | `✓ Compiled successfully (31/31 pages)` |
| `npm run db:push` | Mendorong perubahan skema `schema.ts` ke PostgreSQL | `✓ Schema pushed successfully` |
| `npm run db:studio` | Membuka Drizzle Studio GUI visual database di browser | Akses via `https://local.drizzle.studio` |

---
*Dokumentasi ini dikelola secara otomatis dan merupakan bagian dari repositori [enouGH99/NMS-NOC](https://github.com/enouGH99/NMS-NOC).*
