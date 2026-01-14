import { barangRepository } from '../repositories/barang.repository';
import { NotFoundError, ValidationError } from '../utils/error';
import { CreateBarangRequest } from '../types';

export class BarangService {
    /**
     * Get all barang
     */
    async getAllBarang() {
        return barangRepository.findAll();
    }

    /**
     * Get all barang termasuk yang sudah dihapus (untuk filter histori)
     */
    async getAllBarangWithDeleted() {
        return barangRepository.findAllWithDeleted();
    }

    /**
     * Get barang by ID
     */
    async getBarangById(id: number) {
        const barang = await barangRepository.findById(id);

        if (!barang) {
            throw new NotFoundError(`Barang dengan ID ${id} tidak ditemukan`);
        }

        return barang;
    }

    /**
     * Create barang baru
     */
    async createBarang(data: CreateBarangRequest) {
        // Validasi nama tidak boleh kosong
        if (!data.nama || data.nama.trim() === '') {
            throw new ValidationError('Nama barang tidak boleh kosong');
        }

        // Cek apakah nama sudah ada
        const existingBarang = await barangRepository.findByNama(data.nama.trim());
        if (existingBarang) {
            throw new ValidationError(`Barang dengan nama "${data.nama}" sudah ada`);
        }

        return barangRepository.create({
            nama: data.nama.trim(),
            keterangan: data.keterangan?.trim(),
            gambar: data.gambar,
        });
    }

    /**
     * Update barang
     */
    async updateBarang(id: number, data: Partial<CreateBarangRequest>) {
        // Cek barang exists
        const barang = await barangRepository.findById(id);
        if (!barang) {
            throw new NotFoundError(`Barang dengan ID ${id} tidak ditemukan`);
        }

        // Validasi nama jika diupdate
        if (data.nama !== undefined) {
            if (!data.nama || data.nama.trim() === '') {
                throw new ValidationError('Nama barang tidak boleh kosong');
            }

            // Cek duplikasi nama (kecuali untuk barang ini sendiri)
            const existingBarang = await barangRepository.findByNama(data.nama.trim());
            if (existingBarang && existingBarang.id !== id) {
                throw new ValidationError(`Barang dengan nama "${data.nama}" sudah ada`);
            }
        }

        return barangRepository.update(id, {
            nama: data.nama?.trim(),
            keterangan: data.keterangan?.trim(),
            gambar: data.gambar,
        });
    }

    /**
     * Soft delete barang (set deletedAt, tidak menghapus data)
     * Histori stok tetap tersimpan untuk referensi
     */
    async deleteBarang(id: number) {
        // Cek barang exists
        const barang = await barangRepository.findById(id);
        if (!barang) {
            throw new NotFoundError(`Barang dengan ID ${id} tidak ditemukan`);
        }

        // Cek apakah sudah dihapus sebelumnya (type assertion karena prisma belum di-regenerate)
        if ((barang as any).deletedAt) {
            throw new ValidationError('Barang sudah dihapus sebelumnya');
        }

        return barangRepository.delete(id);
    }

    /**
     * Restore barang yang sudah dihapus
     */
    async restoreBarang(id: number) {
        // Cek barang exists
        const barang = await barangRepository.findById(id);
        if (!barang) {
            throw new NotFoundError(`Barang dengan ID ${id} tidak ditemukan`);
        }

        // Cek apakah barang memang sudah dihapus
        if (!barang.deletedAt) {
            throw new ValidationError('Barang masih aktif, tidak perlu di-restore');
        }

        return barangRepository.restore(id);
    }
}

export const barangService = new BarangService();
