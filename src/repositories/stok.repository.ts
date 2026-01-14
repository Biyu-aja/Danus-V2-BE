import { prisma } from '../utils/transaction';
import { TransactionClient } from '../utils/transaction';

export class StokRepository {
    /**
     * Create stok harian baru
     */
    async create(data: {
        barangId: number;
        harga: number;
        stok: number;
        modal: number;
        keterangan?: string;
        tanggalEdar: Date;
    }) {
        return prisma.stokHarian.create({
            data,
            include: {
                barang: true,
            },
        });
    }

    /**
     * Get stok hari ini
     */
    async findToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return prisma.stokHarian.findMany({
            where: {
                tanggalEdar: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                barang: true,
            },
            orderBy: { tanggalEdar: 'desc' },
        });
    }

    /**
     * Get stok hari ini dengan detail setor untuk perhitungan jumlah_ambil & jumlah_setor
     */
    async findTodayWithDetails() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return prisma.stokHarian.findMany({
            where: {
                tanggalEdar: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                barang: true,
                detailSetor: {
                    select: {
                        qty: true,
                        tanggalSetor: true,
                        ambilBarang: {
                            select: {
                                userId: true
                            }
                        }
                    },
                },
            },
            orderBy: { tanggalEdar: 'desc' },
        });
    }

    /**
     * Get histori stok dengan pagination dan filter
     */
    async findHistori(options: {
        page?: number;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
        barangId?: number;
    } = {}) {
        const { page = 1, limit = 50, startDate, endDate, barangId } = options;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (startDate || endDate) {
            where.tanggalEdar = {};
            if (startDate) where.tanggalEdar.gte = startDate;
            if (endDate) where.tanggalEdar.lte = endDate;
        }

        if (barangId) {
            where.barangId = barangId;
        }

        const [data, total] = await Promise.all([
            prisma.stokHarian.findMany({
                where,
                skip,
                take: limit,
                include: {
                    barang: true,
                    detailSetor: {
                        select: {
                            qty: true,
                            tanggalSetor: true,
                            ambilBarang: {
                                select: {
                                    userId: true
                                }
                            }
                        }
                    }
                },
                orderBy: { tanggalEdar: 'desc' },
            }),
            prisma.stokHarian.count({ where }),
        ]);

        return { data, total };
    }

    /**
     * Get stok by ID
     */
    async findById(id: number) {
        return prisma.stokHarian.findUnique({
            where: { id },
            include: {
                barang: true,
            },
        });
    }

    /**
     * Get stok by ID with detail users (who took/deposited)
     */
    async findByIdWithUsers(id: number) {
        return prisma.stokHarian.findUnique({
            where: { id },
            include: {
                barang: true,
                detailSetor: {
                    include: {
                        ambilBarang: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        nama_lengkap: true,
                                        username: true,
                                        role: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });
    }

    /**
     * Update stok (kurangi qty) - dalam transaction
     */
    async decrementStok(tx: TransactionClient, id: number, qty: number) {
        return tx.stokHarian.update({
            where: { id },
            data: {
                stok: {
                    decrement: qty,
                },
            },
        });
    }

    /**
     * Update stok harian - dalam transaction
     */
    async update(tx: TransactionClient, id: number, data: {
        harga?: number;
        stok?: number;
        modal?: number;
        keterangan?: string;
    }) {
        return tx.stokHarian.update({
            where: { id },
            data,
            include: {
                barang: true,
            },
        });
    }

    /**
     * Delete stok harian - dalam transaction
     */
    async delete(tx: TransactionClient, id: number) {
        return tx.stokHarian.delete({
            where: { id },
        });
    }

    /**
     * Check if stok has any detailSetor (sudah diambil)
     */
    async hasDetailSetor(id: number) {
        const count = await prisma.detailSetor.count({
            where: { stokHarianId: id },
        });
        return count > 0;
    }
}

export const stokRepository = new StokRepository();
