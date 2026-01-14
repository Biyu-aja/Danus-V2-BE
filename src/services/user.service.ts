import { userRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/error';

export class UserService {
    /**
     * Get all users
     */
    async getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get user by ID
     */
    async getUserById(id: number) {
        const user = await userRepository.findByIdWithRelations(id);

        if (!user) {
            throw new NotFoundError(`User dengan ID ${id} tidak ditemukan`);
        }

        return user;
    }

    /**
     * Get all users with today's status
     * Status: SUDAH_SETOR, BELUM_SETOR, BELUM_AMBIL
     */
    async getUsersWithTodayStatus() {
        const users = await userRepository.findAllWithTodayStatus();

        // Process each user to calculate their status
        return users.map(user => {
            let status: 'SUDAH_SETOR' | 'BELUM_SETOR' | 'BELUM_AMBIL' = 'BELUM_AMBIL';
            let totalAmbil = 0;
            let totalSetor = 0;
            let totalHarusSetor = 0;

            // Track barang taken by this user
            const barangMap = new Map<number, { barangId: number; nama: string; qty: number; totalHarga: number }>();

            if (user.ambilBarang && user.ambilBarang.length > 0) {
                // User has taken items today
                for (const ambil of user.ambilBarang) {
                    if (ambil.detailSetor) {
                        for (const detail of ambil.detailSetor) {
                            totalAmbil += detail.qty;
                            totalHarusSetor += detail.totalHarga;
                            if (detail.tanggalSetor) {
                                totalSetor += detail.qty;
                            }

                            // Track barang
                            const barangId = detail.stokHarian?.barang?.id;
                            const barangNama = detail.stokHarian?.barang?.nama;
                            if (barangId && barangNama) {
                                const existing = barangMap.get(barangId);
                                if (existing) {
                                    existing.qty += detail.qty;
                                    existing.totalHarga += detail.totalHarga;
                                } else {
                                    barangMap.set(barangId, {
                                        barangId,
                                        nama: barangNama,
                                        qty: detail.qty,
                                        totalHarga: detail.totalHarga,
                                    });
                                }
                            }
                        }
                    }
                }

                // Determine status based on setor
                if (totalSetor > 0 && totalSetor >= totalAmbil) {
                    status = 'SUDAH_SETOR';
                } else if (totalAmbil > 0) {
                    status = 'BELUM_SETOR';
                }
            }

            return {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                nomor_telepon: user.nomor_telepon,
                catatan: user.catatan,
                status,
                totalAmbil,
                totalSetor,
                totalHarusSetor,
                ambilBarangCount: user.ambilBarang?.length || 0,
                barangList: Array.from(barangMap.values()),
            };
        });
    }

    /**
     * Get user statistics for a specific month
     */
    async getUserMonthlyStats(userId: number, year: number, month: number) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError(`User dengan ID ${userId} tidak ditemukan`);
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        // Get user transactions and stok dates in parallel
        const [transactions, stokDates] = await Promise.all([
            userRepository.findUserTransactionsInRange(userId, startDate, endDate),
            userRepository.findStokDatesInRange(startDate, endDate),
        ]);

        // Create a Set of dates that have stok (for quick lookup)
        const stokDateSet = new Set(
            stokDates.map(d => {
                const date = new Date(d);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            })
        );

        // Prepare calendar data
        const daysInMonth = new Date(year, month, 0).getDate();
        const calendar: { date: string; status: 'HIJAU' | 'KUNING' | 'MERAH' | 'ABU' | 'HITAM'; detail?: any }[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month - 1, day);
            // Fix: Construct date string manually to avoid timezone shift from toISOString()
            const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

            let status: 'HIJAU' | 'KUNING' | 'MERAH' | 'ABU' | 'HITAM';

            // Default to gray for weekends
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                status = 'ABU';
            } else if (!stokDateSet.has(dateString)) {
                // No stok distributed on this day - HITAM
                status = 'HITAM';
            } else {
                status = 'MERAH'; // Default to did not take
            }

            // Find transactions for this day
            const dailyTx = transactions.filter(tx => {
                const txDate = new Date(tx.tanggalAmbil);
                return txDate.getDate() === day && txDate.getMonth() === month - 1 && txDate.getFullYear() === year;
            });

            // Declare outside if block so they're in scope for calendar.push()
            let totalAmbil = 0;
            let totalSetor = 0;

            if (dailyTx.length > 0) {
                for (const tx of dailyTx) {
                    // Check details if available (assuming detailSetor exists based on previous simple types)
                    // If complex detail logic is needed, we traverse detailSetor
                    if (tx.detailSetor) {
                        for (const detail of tx.detailSetor) {
                            totalAmbil += detail.qty;
                            if (detail.tanggalSetor) {
                                totalSetor += detail.qty;
                            }
                        }
                    }
                }

                if (totalAmbil > 0) {
                    if (totalSetor >= totalAmbil) {
                        status = 'HIJAU';
                    } else {
                        status = 'KUNING';
                    }
                }
            }

            calendar.push({
                date: dateString,
                status,
                detail: dailyTx.length > 0 ? {
                    count: dailyTx.length,
                    totalAmbil,
                    totalSetor
                } : undefined
            });
        }

        // Calculate summary stats
        // Total transactions for ALL time could be fetched separately, 
        // but for now let's return user info and this monthly calendar.

        return {
            user,
            calendar
        };
    }
}

export const userService = new UserService();
