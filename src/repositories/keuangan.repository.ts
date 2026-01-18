import { prisma } from '../utils/transaction';
import { TransactionClient } from '../utils/transaction';

export class KeuanganRepository {
    /**
     * Get saldo terkini (single record with id=1)
     */
    async getSaldo() {
        return prisma.keuangan.findUnique({
            where: { id: 1 },
        });
    }

    /**
     * Initialize saldo if not exists
     */
    async initializeSaldo() {
        return prisma.keuangan.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                totalSaldo: 0,
            },
        });
    }

    /**
     * Update saldo (increment/decrement)
     */
    async updateSaldo(tx: TransactionClient, amount: number) {
        return tx.keuangan.update({
            where: { id: 1 },
            data: {
                totalSaldo: {
                    increment: amount,
                },
            },
        });
    }

    /**
     * Create detail keuangan (histori transaksi)
     */
    async createDetailKeuangan(
        tx: TransactionClient,
        data: {
            detailSetorId?: number;
            title: string;
            tipe: 'PEMASUKAN' | 'PENGELUARAN';
            nominal: number;
            keterangan?: string;
        }
    ) {
        return tx.detailKeuangan.create({
            data,
        });
    }

    /**
     * Get histori transaksi dengan pagination
     */
    async getHistori(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.detailKeuangan.findMany({
                skip,
                take: limit,
                include: {
                    detailSetor: {
                        include: {
                            stokHarian: {
                                include: {
                                    barang: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.detailKeuangan.count(),
        ]);

        return { data, total };
    }

    /**
     * Get histori transaksi berdasarkan bulan
     */
    async getHistoriByMonth(year: number, month: number) {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        const data = await prisma.detailKeuangan.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            include: {
                detailSetor: {
                    include: {
                        ambilBarang: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        nama_lengkap: true,
                                    },
                                },
                            },
                        },
                        stokHarian: {
                            include: {
                                barang: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform data to include penyetor info at top level
        const transformedData = data.map(item => ({
            ...item,
            penyetor: item.detailSetor?.ambilBarang?.user || null,
        }));

        return transformedData;
    }

    /**
     * Get laporan harian
     * Note: tanggal yang masuk sudah dalam WIB timezone
     * Kita perlu convert ke UTC range untuk query database
     */
    async getLaporanHarian(tanggal: Date) {
        // WIB adalah UTC+7, jadi 00:00 WIB = 17:00 UTC hari sebelumnya
        // dan 23:59 WIB = 16:59 UTC hari yang sama

        // Get year, month, day dari tanggal WIB
        const year = tanggal.getFullYear();
        const month = tanggal.getMonth();
        const day = tanggal.getDate();

        // Buat range dalam UTC yang sesuai dengan hari WIB
        // 00:00:00 WIB = -7 hours dari local = 17:00:00 UTC hari sebelumnya
        const startOfDayWIB = new Date(Date.UTC(year, month, day, -7, 0, 0, 0));
        // 23:59:59 WIB = -7 hours = 16:59:59 UTC
        const endOfDayWIB = new Date(Date.UTC(year, month, day, 16, 59, 59, 999));

        const [pemasukan, pengeluaran, transaksi] = await Promise.all([
            prisma.detailKeuangan.aggregate({
                where: {
                    tipe: 'PEMASUKAN',
                    createdAt: {
                        gte: startOfDayWIB,
                        lte: endOfDayWIB,
                    },
                },
                _sum: { nominal: true },
                _count: true,
            }),
            prisma.detailKeuangan.aggregate({
                where: {
                    tipe: 'PENGELUARAN',
                    createdAt: {
                        gte: startOfDayWIB,
                        lte: endOfDayWIB,
                    },
                },
                _sum: { nominal: true },
                _count: true,
            }),
            prisma.detailKeuangan.findMany({
                where: {
                    createdAt: {
                        gte: startOfDayWIB,
                        lte: endOfDayWIB,
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            tanggal: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            pemasukan: {
                total: pemasukan._sum.nominal || 0,
                count: pemasukan._count,
            },
            pengeluaran: {
                total: pengeluaran._sum.nominal || 0,
                count: pengeluaran._count,
            },
            selisih: (pemasukan._sum.nominal || 0) - (pengeluaran._sum.nominal || 0),
            transaksi,
        };
    }

    /**
     * Get laporan bulanan
     */
    async getLaporanBulanan(year: number, month: number) {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        const [pemasukan, pengeluaran, transaksiPerHari] = await Promise.all([
            prisma.detailKeuangan.aggregate({
                where: {
                    tipe: 'PEMASUKAN',
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                _sum: { nominal: true },
                _count: true,
            }),
            prisma.detailKeuangan.aggregate({
                where: {
                    tipe: 'PENGELUARAN',
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                _sum: { nominal: true },
                _count: true,
            }),
            prisma.detailKeuangan.groupBy({
                by: ['createdAt'],
                where: {
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                _sum: { nominal: true },
                _count: true,
            }),
        ]);

        return {
            bulan: `${year}-${String(month).padStart(2, '0')}`,
            pemasukan: {
                total: pemasukan._sum.nominal || 0,
                count: pemasukan._count,
            },
            pengeluaran: {
                total: pengeluaran._sum.nominal || 0,
                count: pengeluaran._count,
            },
            selisih: (pemasukan._sum.nominal || 0) - (pengeluaran._sum.nominal || 0),
            jumlahHariAktif: transaksiPerHari.length,
        };
    }

    /**
     * Get detail keuangan by ID
     */
    async findById(id: number) {
        return prisma.detailKeuangan.findUnique({
            where: { id },
            include: {
                detailSetor: {
                    include: {
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
                            },
                        },
                        stokHarian: {
                            include: {
                                barang: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Get the ID of the last (most recent) transaction
     */
    async getLastTransactionId() {
        const last = await prisma.detailKeuangan.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });
        return last?.id || null;
    }

    /**
     * Delete detail keuangan
     */
    async deleteDetailKeuangan(tx: TransactionClient, id: number) {
        return tx.detailKeuangan.delete({
            where: { id },
        });
    }
}

export const keuanganRepository = new KeuanganRepository();
