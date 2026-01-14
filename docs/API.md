# Danus OSIS Backend API Documentation

## Overview

REST API untuk aplikasi pencatatan dana usaha (Danus) organisasi OSIS. API ini menangani pengambilan barang oleh anggota, proses setor hasil penjualan, pencatatan keuangan, dan laporan.

**Base URL:** `http://localhost:3000`

---

## Quick Start Guide

### 🚀 Menjalankan Server

```bash
# 1. Install dependencies
cd back-end
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run migrations (jika belum)
npx prisma migrate dev

# 4. Start server
npm run dev
```

Server akan berjalan di `http://localhost:3000`

---

### 📋 Contoh Penggunaan (PowerShell)

#### 1. Cek Server Status
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
```

#### 2. Get Semua User
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method GET
```

#### 3. Get User by ID
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/1" -Method GET
```

#### 4. Buat Stok Harian Baru
```powershell
$body = @{
    barangId = 1
    harga = 5000
    stok = 100
    modal = 3000
    keterangan = "Stok hari ini"
    tanggalEdar = "2024-12-16"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/stok" -Method POST -Body $body -ContentType "application/json"
```

#### 5. Get Stok Hari Ini
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/stok/hari-ini" -Method GET
```

#### 6. Ambil Barang
```powershell
$body = @{
    userId = 1
    setorKepadaId = 2
    keterangan = "Ambil untuk dijual"
    items = @(
        @{ stokHarianId = 1; qty = 10 },
        @{ stokHarianId = 2; qty = 5 }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/ambil-barang" -Method POST -Body $body -ContentType "application/json"
```

#### 7. Get Ambil Barang Belum Setor
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/ambil-barang/belum-setor" -Method GET
```

#### 8. Proses Setor (CRITICAL)
```powershell
$body = @{
    detailSetorIds = @(1, 2, 3)
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/setor" -Method POST -Body $body -ContentType "application/json"
```

#### 9. Get Saldo
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/keuangan/saldo" -Method GET
```

#### 10. Catat Pengeluaran
```powershell
$body = @{
    title = "Beli plastik"
    nominal = 10000
    keterangan = "Untuk packing"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/keuangan/pengeluaran" -Method POST -Body $body -ContentType "application/json"
```

#### 11. Laporan Harian
```powershell
# Hari ini
Invoke-RestMethod -Uri "http://localhost:3000/api/keuangan/laporan/harian" -Method GET

# Tanggal spesifik
Invoke-RestMethod -Uri "http://localhost:3000/api/keuangan/laporan/harian?tanggal=2024-12-16" -Method GET
```

#### 12. Laporan Bulanan
```powershell
# Bulan ini
Invoke-RestMethod -Uri "http://localhost:3000/api/keuangan/laporan/bulanan" -Method GET

# Bulan spesifik
Invoke-RestMethod -Uri "http://localhost:3000/api/keuangan/laporan/bulanan?bulan=2024-12" -Method GET
```

---

### 📋 Contoh Penggunaan (cURL - Bash/Git Bash)

#### 1. Cek Server Status
```bash
curl http://localhost:3000/health
```

#### 2. Get Semua User
```bash
curl http://localhost:3000/api/users
```

#### 3. Buat Stok Harian
```bash
curl -X POST http://localhost:3000/api/stok \
  -H "Content-Type: application/json" \
  -d '{"barangId":1,"harga":5000,"stok":100,"modal":3000,"tanggalEdar":"2024-12-16"}'
```

#### 4. Ambil Barang
```bash
curl -X POST http://localhost:3000/api/ambil-barang \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"setorKepadaId":2,"items":[{"stokHarianId":1,"qty":10}]}'
```

#### 5. Proses Setor
```bash
curl -X POST http://localhost:3000/api/setor \
  -H "Content-Type: application/json" \
  -d '{"detailSetorIds":[1,2]}'
```

#### 6. Catat Pengeluaran
```bash
curl -X POST http://localhost:3000/api/keuangan/pengeluaran \
  -H "Content-Type: application/json" \
  -d '{"title":"Beli plastik","nominal":10000}'
```

---

## 🔄 Alur Kerja Lengkap

```
1. Admin buat Stok Harian (POST /api/stok)
   ↓
2. User ambil barang (POST /api/ambil-barang)
   → Status: BELUM_SETOR
   → Detail setor dibuat otomatis
   ↓
3. User jual barang di lapangan
   ↓
4. User setor hasil penjualan (POST /api/setor)
   → Stok berkurang
   → Saldo bertambah
   → Status: SUDAH_SETOR (jika semua disetor)
   ↓
5. Lihat laporan (GET /api/keuangan/laporan/harian)
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Berhasil...",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Berhasil...",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detail error (development only)"
}
```

---

## Endpoints

### Health Check

#### `GET /health`
Check server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-16T00:00:00.000Z",
  "environment": "development"
}
```

---

## User

### `GET /api/users`
Get list semua user.

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mendapatkan data users",
  "data": [
    {
      "id": 1,
      "nama_lengkap": "John Doe",
      "username": "johndoe",
      "nomor_telepon": "081234567890",
      "role": "user",
      "catatan": null
    }
  ]
}
```

---

### `GET /api/users/:id`
Get user by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | number | User ID |

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mendapatkan data user",
  "data": {
    "id": 1,
    "nama_lengkap": "John Doe",
    "username": "johndoe",
    "nomor_telepon": "081234567890",
    "role": "user",
    "catatan": null,
    "ambilBarang": [
      {
        "id": 1,
        "status": "BELUM_SETOR",
        "tanggalAmbil": "2024-12-16T00:00:00.000Z"
      }
    ]
  }
}
```

**Error Cases:**
- `404` - User tidak ditemukan

---

## Barang

### `GET /api/barang`
Get list semua barang.

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mendapatkan data barang",
  "data": [
    {
      "id": 1,
      "nama": "Snack A",
      "keterangan": "Snack enak",
      "stokHarian": [
        {
          "id": 1,
          "harga": 5000,
          "stok": 100,
          "modal": 3000,
          "tanggalEdar": "2024-12-16T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

### `GET /api/barang/:id`
Get barang by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | number | Barang ID |

**Error Cases:**
- `404` - Barang tidak ditemukan

---

## Stok Harian

### `POST /api/stok`
Buat stok harian baru.

**Request Body:**
```json
{
  "barangId": 1,
  "harga": 5000,
  "stok": 100,
  "modal": 3000,
  "keterangan": "Stok untuk hari ini",
  "tanggalEdar": "2024-12-16"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| barangId | number | Yes | ID barang |
| harga | number | Yes | Harga jual per item |
| stok | number | Yes | Jumlah stok |
| modal | number | Yes | Modal per item |
| keterangan | string | No | Catatan opsional |
| tanggalEdar | string | Yes | Tanggal edar (ISO format) |

**Response:**
```json
{
  "success": true,
  "message": "Berhasil membuat stok harian",
  "data": {
    "id": 1,
    "barangId": 1,
    "harga": 5000,
    "stok": 100,
    "modal": 3000,
    "keterangan": "Stok untuk hari ini",
    "tanggalEdar": "2024-12-16T00:00:00.000Z",
    "barang": {
      "id": 1,
      "nama": "Snack A"
    }
  }
}
```

**Error Cases:**
- `400` - Validasi gagal (harga/stok <= 0, format tanggal salah)
- `404` - Barang tidak ditemukan

---

### `GET /api/stok/hari-ini`
Get stok hari ini.

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mendapatkan stok hari ini",
  "data": [
    {
      "id": 1,
      "barangId": 1,
      "harga": 5000,
      "stok": 100,
      "modal": 3000,
      "tanggalEdar": "2024-12-16T00:00:00.000Z",
      "barang": {
        "id": 1,
        "nama": "Snack A"
      }
    }
  ]
}
```

---

### `GET /api/stok/histori`
Get histori stok dengan pagination.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| page | number | 1 | Halaman |
| limit | number | 20 | Jumlah per halaman |

**Response:** Paginated response

---

## Ambil Barang

### `POST /api/ambil-barang`
Create ambil barang baru.

**Request Body:**
```json
{
  "userId": 1,
  "setorKepadaId": 2,
  "keterangan": "Ambil untuk dijual",
  "items": [
    {
      "stokHarianId": 1,
      "qty": 10
    },
    {
      "stokHarianId": 2,
      "qty": 5
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | number | Yes | ID user yang ambil |
| setorKepadaId | number | Yes | ID admin penerima setor |
| keterangan | string | No | Catatan opsional |
| items | array | Yes | List item yang diambil |
| items[].stokHarianId | number | Yes | ID stok harian |
| items[].qty | number | Yes | Jumlah yang diambil |

**Response:**
```json
{
  "success": true,
  "message": "Berhasil membuat ambil barang",
  "data": {
    "id": 1,
    "userId": 1,
    "setorKepadaId": 2,
    "status": "BELUM_SETOR",
    "keterangan": "Ambil untuk dijual",
    "tanggalAmbil": "2024-12-16T00:00:00.000Z",
    "user": {
      "id": 1,
      "nama_lengkap": "John Doe",
      "username": "johndoe"
    },
    "setorKepada": {
      "id": 2,
      "nama_lengkap": "Admin",
      "username": "admin"
    },
    "detailSetor": [
      {
        "id": 1,
        "stokHarianId": 1,
        "qty": 10,
        "totalHarga": 50000,
        "tanggalSetor": null,
        "stokHarian": {
          "barang": {
            "nama": "Snack A"
          }
        }
      }
    ]
  }
}
```

**Error Cases:**
- `400` - Validasi gagal, stok tidak mencukupi
- `404` - User/Admin/Stok tidak ditemukan

---

### `GET /api/ambil-barang/belum-setor`
Get ambil barang yang belum setor.

**Response:** List ambil barang dengan status `BELUM_SETOR` atau `SEBAGIAN_SETOR`

---

### `GET /api/ambil-barang/user/:userId`
Get ambil barang by user ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| userId | number | User ID |

**Error Cases:**
- `404` - User tidak ditemukan

---

### `GET /api/ambil-barang/:id`
Get ambil barang by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | number | Ambil Barang ID |

**Error Cases:**
- `404` - Ambil barang tidak ditemukan

---

## Setor (CRITICAL)

### `POST /api/setor`
Proses setor barang.

⚠️ **CRITICAL:** Endpoint ini menggunakan **database transaction** untuk menjamin atomicity.

**Langkah yang dilakukan:**
1. Validasi detail setor belum pernah disetor
2. Tandai detail setor sebagai disetor
3. Kurangi stok harian
4. Catat pemasukan ke histori keuangan
5. Update saldo kas
6. Update status ambil barang

**Request Body:**
```json
{
  "detailSetorIds": [1, 2, 3]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| detailSetorIds | number[] | Yes | Array ID detail setor yang akan diproses |

**Response:**
```json
{
  "success": true,
  "message": "Berhasil memproses setor",
  "data": {
    "message": "Setor berhasil diproses",
    "totalPemasukan": 150000,
    "saldoTerbaru": 500000,
    "details": [
      {
        "detailSetorId": 1,
        "barangNama": "Snack A",
        "qty": 10,
        "totalHarga": 50000
      },
      {
        "detailSetorId": 2,
        "barangNama": "Snack B",
        "qty": 5,
        "totalHarga": 100000
      }
    ]
  }
}
```

**Error Cases:**
- `400` - Validasi gagal
- `404` - Detail setor tidak ditemukan
- `409` - Detail setor sudah pernah disetor

---

## Keuangan

### `GET /api/keuangan/saldo`
Get saldo terkini.

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mendapatkan saldo",
  "data": {
    "id": 1,
    "totalSaldo": 500000,
    "updatedAt": "2024-12-16T00:00:00.000Z"
  }
}
```

---

### `GET /api/keuangan/histori`
Get histori transaksi dengan pagination.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| page | number | 1 | Halaman |
| limit | number | 20 | Jumlah per halaman |

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mendapatkan histori transaksi",
  "data": [
    {
      "id": 1,
      "detailSetorId": 1,
      "title": "Setor: Snack A",
      "tipe": "PEMASUKAN",
      "nominal": 50000,
      "keterangan": "Qty: 10 x Rp5000",
      "createdAt": "2024-12-16T00:00:00.000Z",
      "detailSetor": {
        "stokHarian": {
          "barang": {
            "nama": "Snack A"
          }
        }
      }
    },
    {
      "id": 2,
      "detailSetorId": null,
      "title": "Beli plastik",
      "tipe": "PENGELUARAN",
      "nominal": 10000,
      "keterangan": "Untuk packing",
      "createdAt": "2024-12-16T01:00:00.000Z",
      "detailSetor": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### `POST /api/keuangan/pengeluaran`
Catat pengeluaran manual.

**Request Body:**
```json
{
  "title": "Beli plastik",
  "nominal": 10000,
  "keterangan": "Untuk packing"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Judul pengeluaran |
| nominal | number | Yes | Nominal pengeluaran |
| keterangan | string | No | Catatan opsional |

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mencatat pengeluaran",
  "data": {
    "message": "Pengeluaran berhasil dicatat",
    "pengeluaran": {
      "title": "Beli plastik",
      "nominal": 10000,
      "keterangan": "Untuk packing"
    },
    "saldoTerbaru": 490000
  }
}
```

**Error Cases:**
- `400` - Validasi gagal, saldo tidak mencukupi

---

### `GET /api/keuangan/laporan/harian`
Get laporan harian.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| tanggal | string | Hari ini | Tanggal (ISO format) |

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mendapatkan laporan harian",
  "data": {
    "tanggal": "2024-12-16",
    "pemasukan": {
      "total": 500000,
      "count": 10
    },
    "pengeluaran": {
      "total": 50000,
      "count": 2
    },
    "selisih": 450000,
    "transaksi": [ ... ]
  }
}
```

---

### `GET /api/keuangan/laporan/bulanan`
Get laporan bulanan.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| bulan | string | Bulan ini | Format: YYYY-MM |

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mendapatkan laporan bulanan",
  "data": {
    "bulan": "2024-12",
    "pemasukan": {
      "total": 5000000,
      "count": 100
    },
    "pengeluaran": {
      "total": 500000,
      "count": 20
    },
    "selisih": 4500000,
    "jumlahHariAktif": 15
  }
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource berhasil dibuat |
| 400 | Bad Request - Validasi gagal |
| 404 | Not Found - Resource tidak ditemukan |
| 409 | Conflict - Data konflik |
| 500 | Internal Server Error - Error server |

---

## Aturan Bisnis

### Status Ambil Barang
- `BELUM_SETOR` - Belum ada detail yang disetor
- `SEBAGIAN_SETOR` - Sebagian detail sudah disetor
- `SUDAH_SETOR` - Semua detail sudah disetor

### Tipe Keuangan
- `PEMASUKAN` - Uang masuk (dari setor)
- `PENGELUARAN` - Uang keluar (manual)

### Prinsip Penting
1. **Saldo hanya 1 record** - Tidak ada histori saldo
2. **Transaksi adalah satu-satunya history** - DetailKeuangan sebagai audit trail
3. **Setor harus atomic** - Semua operasi dalam 1 transaction
4. **Stok berkurang saat setor** - Bukan saat ambil barang
