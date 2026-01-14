import { prisma } from '../utils/transaction';
import { TransactionClient } from '../utils/transaction';

export class AmbilBarangRepository {
    /**
     * Create ambil barang dengan detail setor
     */
    async create(
        tx: TransactionClient,
        data: {
            userId: number;
            setorKepadaId?: number | null;
            keterangan?: string;
            items: {
                stokHarianId: number;
                qty: number;
                totalHarga: number;
            }[];
        }
    ) {
        return tx.ambilBarang.create({
            data: {
                userId: data.userId,
                setorKepadaId: data.setorKepadaId,
                keterangan: data.keterangan,
                status: 'BELUM_SETOR',
                detailSetor: {
                    create: data.items.map((item) => ({
                        stokHarianId: item.stokHarianId,
                        qty: item.qty,
                        totalHarga: item.totalHarga,
                    })),
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
                setorKepada: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
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
        });
    }

    /**
     * Get ambil barang by user ID
     */
    async findByUserId(userId: number) {
        return prisma.ambilBarang.findMany({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
                setorKepada: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
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
            orderBy: { tanggalAmbil: 'desc' },
        });
    }

    /**
     * Get ambil barang yang belum setor
     */
    async findBelumSetor() {
        return prisma.ambilBarang.findMany({
            where: {
                OR: [{ status: 'BELUM_SETOR' }, { status: 'SEBAGIAN_SETOR' }],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
                setorKepada: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
                detailSetor: {
                    where: {
                        tanggalSetor: null,
                    },
                    include: {
                        stokHarian: {
                            include: {
                                barang: true,
                            },
                        },
                    },
                },
            },
            orderBy: { tanggalAmbil: 'asc' },
        });
    }

    /**
     * Get ambil barang by ID
     */
    async findById(id: number) {
        return prisma.ambilBarang.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
                setorKepada: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
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
        });
    }

    /**
     * Update status ambil barang
     */
    async updateStatus(tx: TransactionClient, id: number, status: string) {
        return tx.ambilBarang.update({
            where: { id },
            data: { status },
        });
    }

    /**
     * Update keterangan ambil barang
     */
    async updateKeterangan(id: number, keterangan: string) {
        return prisma.ambilBarang.update({
            where: { id },
            data: { keterangan },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
                setorKepada: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                    },
                },
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
        });
    }
}

export const ambilBarangRepository = new AmbilBarangRepository();
