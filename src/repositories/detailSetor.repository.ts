import { prisma } from '../utils/transaction';
import { TransactionClient } from '../utils/transaction';

export class DetailSetorRepository {
    /**
     * Get detail setor by ID
     */
    async findById(id: number) {
        return prisma.detailSetor.findUnique({
            where: { id },
            include: {
                stokHarian: {
                    include: {
                        barang: true,
                    },
                },
                ambilBarang: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                nama_lengkap: true,
                                username: true,
                                nomor_telepon: true,
                            },
                        },
                        setorKepada: {
                            select: {
                                id: true,
                                nama_lengkap: true,
                                username: true,
                            },
                        },
                    },
                },
                detailKeuangan: true,
            },
        });
    }

    /**
     * Get the last detail setor for a user on a specific stok
     */
    async findLastByUserAndStok(userId: number, stokHarianId: number) {
        return prisma.detailSetor.findFirst({
            where: {
                stokHarianId,
                ambilBarang: {
                    userId,
                },
            },
            include: {
                stokHarian: {
                    include: {
                        barang: true,
                    },
                },
                ambilBarang: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                nama_lengkap: true,
                                username: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                id: 'desc',
            },
        });
    }

    /**
     * Check if this is the last transaction for a user on a stok
     */
    async isLastTransaction(detailSetorId: number, userId: number, stokHarianId: number) {
        const lastTransaction = await this.findLastByUserAndStok(userId, stokHarianId);
        return lastTransaction?.id === detailSetorId;
    }

    /**
     * Update qty of detail setor - in transaction
     */
    async updateQty(tx: TransactionClient, id: number, qty: number, totalHarga: number) {
        return tx.detailSetor.update({
            where: { id },
            data: {
                qty,
                totalHarga,
            },
            include: {
                stokHarian: {
                    include: {
                        barang: true,
                    },
                },
                ambilBarang: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                nama_lengkap: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Delete detail setor - in transaction
     */
    async delete(tx: TransactionClient, id: number) {
        return tx.detailSetor.delete({
            where: { id },
        });
    }

    /**
     * Count detail setor for an ambilBarang
     */
    async countByAmbilBarangId(ambilBarangId: number) {
        return prisma.detailSetor.count({
            where: { ambilBarangId },
        });
    }
}

export const detailSetorRepository = new DetailSetorRepository();
