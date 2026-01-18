import { prisma } from '../utils/transaction';
import { TransactionClient } from '../utils/transaction';
import { getStartOfTodayWIB, getTomorrowStartWIB } from '../utils/timezone';

export class UserRepository {
    /**
     * Get all users
     */
    async findAll() {
        return prisma.user.findMany({
            select: {
                id: true,
                nama_lengkap: true,
                username: true,
                nomor_telepon: true,
                role: true,
                catatan: true,
            },
        });
    }

    /**
     * Get user by ID
     */
    async findById(id: number) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nama_lengkap: true,
                username: true,
                nomor_telepon: true,
                role: true,
                catatan: true,
            },
        });
    }

    /**
     * Get user by ID with relations (for detailed view)
     */
    async findByIdWithRelations(id: number) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nama_lengkap: true,
                username: true,
                nomor_telepon: true,
                role: true,
                catatan: true,
                ambilBarang: {
                    select: {
                        id: true,
                        status: true,
                        tanggalAmbil: true,
                    },
                    orderBy: { tanggalAmbil: 'desc' },
                    take: 10,
                },
            },
        });
    }

    /**
     * Get user transaction within date range
     */
    async findUserTransactionsInRange(userId: number, startDate: Date, endDate: Date) {
        return prisma.ambilBarang.findMany({
            where: {
                userId,
                tanggalAmbil: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: {
                detailSetor: true,
            },
            orderBy: { tanggalAmbil: 'asc' },
        });
    }

    /**
     * Get all users with today's ambil barang status
     * (menggunakan WIB timezone)
     */
    async findAllWithTodayStatus() {
        const today = getStartOfTodayWIB();
        const tomorrow = getTomorrowStartWIB();

        return prisma.user.findMany({
            // Removed role filter to include admins
            select: {
                id: true,
                nama_lengkap: true,
                username: true,
                nomor_telepon: true,
                role: true,
                catatan: true,
                ambilBarang: {
                    where: {
                        tanggalAmbil: {
                            gte: today,
                            lt: tomorrow,
                        },
                    },
                    select: {
                        id: true,
                        status: true,
                        tanggalAmbil: true,
                        detailSetor: {
                            select: {
                                qty: true,
                                totalHarga: true,
                                tanggalSetor: true,
                                stokHarian: {
                                    select: {
                                        id: true,
                                        barang: {
                                            select: {
                                                id: true,
                                                nama: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { tanggalAmbil: 'desc' },
                },
            },
            orderBy: { nama_lengkap: 'asc' },
        });
    }

    /**
     * Get dates that have stok harian in a range
     */
    async findStokDatesInRange(startDate: Date, endDate: Date): Promise<Date[]> {
        const stoks = await prisma.stokHarian.findMany({
            where: {
                tanggalEdar: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            select: {
                tanggalEdar: true,
            },
        });

        return stoks.map(s => s.tanggalEdar);
    }

    /**
     * Update user data (phone number and notes)
     */
    async updateUser(id: number, data: { nomor_telepon?: string; catatan?: string }) {
        return prisma.user.update({
            where: { id },
            data: {
                ...(data.nomor_telepon !== undefined && { nomor_telepon: data.nomor_telepon }),
                ...(data.catatan !== undefined && { catatan: data.catatan }),
            },
            select: {
                id: true,
                nama_lengkap: true,
                username: true,
                nomor_telepon: true,
                role: true,
                catatan: true,
            },
        });
    }
}

export const userRepository = new UserRepository();
