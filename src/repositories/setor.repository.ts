import { prisma } from '../utils/transaction';
import { TransactionClient } from '../utils/transaction';

export class SetorRepository {
    /**
     * Get detail setor by IDs
     */
    async findDetailSetorByIds(ids: number[]) {
        return prisma.detailSetor.findMany({
            where: {
                id: { in: ids },
            },
            include: {
                ambilBarang: true,
                stokHarian: {
                    include: {
                        barang: true,
                    },
                },
            },
        });
    }

    /**
     * Update detail setor tanggal (tandai sudah setor)
     */
    async markAsSetor(tx: TransactionClient, id: number) {
        return tx.detailSetor.update({
            where: { id },
            data: {
                tanggalSetor: new Date(),
            },
        });
    }

    /**
     * Get semua detail setor dari satu ambil barang
     */
    async findDetailSetorByAmbilBarangId(ambilBarangId: number) {
        return prisma.detailSetor.findMany({
            where: { ambilBarangId },
        });
    }

    /**
     * Check apakah semua detail sudah setor
     */
    async isAllDetailSetor(tx: TransactionClient, ambilBarangId: number) {
        const details = await tx.detailSetor.findMany({
            where: { ambilBarangId },
        });

        return details.every((d) => d.tanggalSetor !== null);
    }

    async hasAnySetor(tx: TransactionClient, ambilBarangId: number) {
        const count = await tx.detailSetor.count({
            where: {
                ambilBarangId,
                tanggalSetor: { not: null },
            },
        });
        return count > 0;
    }

    // UPDATE QTY & PRICE (untuk sisa yang belum disetor)
    async updateQtyAndTotalHarga(tx: TransactionClient, id: number, qty: number, totalHarga: number) {
        return tx.detailSetor.update({
            where: { id },
            data: { qty, totalHarga },
        });
    }

    // CREATE NEW DETAIL SETOR (untuk bagian yang disetor)
    async createDetailSetor(tx: TransactionClient, data: {
        ambilBarangId: number,
        stokHarianId: number,
        qty: number,
        totalHarga: number,
        tanggalSetor: Date
    }) {
        return tx.detailSetor.create({
            data,
        });
    }

    // UPDATE AMBIL BARANG SETOR KEPADA
    async updateSetorKepada(tx: TransactionClient, ambilBarangId: number, adminId: number) {
        return tx.ambilBarang.update({
            where: { id: ambilBarangId },
            data: { setorKepadaId: adminId }
        });
    }
}

export const setorRepository = new SetorRepository();
