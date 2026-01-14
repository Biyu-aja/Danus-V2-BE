// Type definitions untuk Danus Backend API

// ============ ENUMS ============
export type UserRole = 'user' | 'admin';
export type StatusAmbilBarang = 'BELUM_SETOR' | 'SEBAGIAN_SETOR' | 'SUDAH_SETOR';
export type TipeKeuangan = 'PEMASUKAN' | 'PENGELUARAN';

// ============ REQUEST TYPES ============

// Barang
export interface CreateBarangRequest {
    nama: string;
    keterangan?: string;
    gambar?: string;
}

// Stok
export interface CreateStokHarianRequest {
    barangId: number;
    harga: number;
    stok: number;
    modal: number;
    keterangan?: string;
    tanggalEdar: string; // ISO date string
}

// Ambil Barang
export interface CreateAmbilBarangRequest {
    userId: number;
    setorKepadaId?: number | null;
    keterangan?: string;
    items: {
        stokHarianId: number;
        qty: number;
    }[];
}

// Setor
// Setor
export interface ProsesSetorItem {
    detailSetorId: number;
    qty: number;
}

export interface ProsesSetorRequest {
    adminId?: number;
    items: ProsesSetorItem[];
    // Deprecated but kept for backward compatibility checking
    detailSetorIds?: number[];
}

// Keuangan
export interface CreatePengeluaranRequest {
    title: string;
    nominal: number;
    keterangan?: string;
}

// ============ RESPONSE TYPES ============

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============ QUERY PARAMS ============

export interface PaginationQuery {
    page?: string;
    limit?: string;
}

export interface DateRangeQuery {
    startDate?: string;
    endDate?: string;
}

export interface LaporanHarianQuery {
    tanggal?: string; // ISO date string, default: hari ini
}

export interface LaporanBulananQuery {
    bulan?: string; // Format: YYYY-MM
}
