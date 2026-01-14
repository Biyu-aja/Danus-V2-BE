import { prisma } from '../utils/transaction';
import { CreateBarangRequest } from '../types';

export class BarangRepository {
    /**
     * Get all barang
     */
    async findAll() {
        return prisma.barang.findMany({
            where: {
                deletedAt: null, // Hanya tampilkan barang yang belum dihapus
            },
            include: {
                stokHarian: {
                    orderBy: { tanggalEdar: 'desc' },
                    take: 1,
                },
            },
        });
    }

    /**
     * Get all barang termasuk yang sudah dihapus (untuk filter histori)
     * Include semua stokHarian untuk statistik
     */
    async findAllWithDeleted() {
        return prisma.barang.findMany({
            include: {
                stokHarian: {
                    orderBy: { tanggalEdar: 'desc' },
                    include: {
                        detailSetor: {
                            where: {
                                tanggalSetor: { not: null }, // Hanya yang sudah disetor
                            },
                        },
                    },
                },
            },
            orderBy: { nama: 'asc' },
        });
    }

    /**
     * Get barang by ID dengan statistik lengkap
     */
    async findById(id: number) {
        return prisma.barang.findUnique({
            where: { id },
            include: {
                stokHarian: {
                    orderBy: { tanggalEdar: 'desc' },
                    include: {
                        detailSetor: {
                            where: {
                                tanggalSetor: { not: null }, // Hanya yang sudah disetor
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Create barang baru
     */
    async create(data: CreateBarangRequest) {
        return prisma.barang.create({
            data: {
                nama: data.nama,
                keterangan: data.keterangan,
                gambar: data.gambar,
            },
        });
    }

    /**
     * Find barang by nama
     */
    async findByNama(nama: string) {
        return prisma.barang.findFirst({
            where: {
                nama,
                deletedAt: null, // Hanya cari dari barang aktif
            },
        });
    }

    /**
     * Update barang
     */
    async update(id: number, data: Partial<CreateBarangRequest>) {
        return prisma.barang.update({
            where: { id },
            data: {
                nama: data.nama,
                keterangan: data.keterangan,
                gambar: data.gambar,
            },
        });
    }

    /**
     * Soft delete barang (set deletedAt)
     */
    async delete(id: number) {
        return prisma.barang.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    /**
     * Restore barang yang sudah dihapus (set deletedAt ke null)
     */
    async restore(id: number) {
        return prisma.barang.update({
            where: { id },
            data: {
                deletedAt: null,
            },
        });
    }
}
export const barangRepository = new BarangRepository();


