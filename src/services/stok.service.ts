import { stokRepository } from '../repositories/stok.repository';
import { barangRepository } from '../repositories/barang.repository';
import { keuanganRepository } from '../repositories/keuangan.repository';
import { withTransaction } from '../utils/transaction';
import { NotFoundError, ValidationError } from '../utils/error';
import { CreateStokHarianRequest } from '../types';

export class StokService {
    /**
     * Buat stok harian baru
     * - Catat modal sebagai pengeluaran
     * - Kurangi saldo
     */
    async createStokHarian(data: CreateStokHarianRequest) {
        // Validasi barang exists
        const barang = await barangRepository.findById(data.barangId);
        if (!barang) {
            throw new NotFoundError(`Barang dengan ID ${data.barangId} tidak ditemukan`);
        }

        // Validasi harga dan stok
        if (data.harga <= 0) {
            throw new ValidationError('Harga harus lebih dari 0');
        }
        if (data.stok <= 0) {
            throw new ValidationError('Stok harus lebih dari 0');
        }
        if (data.modal < 0) {
            throw new ValidationError('Modal tidak boleh negatif');
        }

        const tanggalEdar = new Date(data.tanggalEdar);
        if (isNaN(tanggalEdar.getTime())) {
            throw new ValidationError('Format tanggal tidak valid');
        }

        // Ensure saldo exists
        await keuanganRepository.initializeSaldo();

        // Check saldo cukup jika modal > 0
        if (data.modal > 0) {
            const currentSaldo = await keuanganRepository.getSaldo();
            if (!currentSaldo || currentSaldo.totalSaldo < data.modal) {
                throw new ValidationError(
                    `Saldo tidak mencukupi untuk modal. Saldo saat ini: Rp${currentSaldo?.totalSaldo || 0}, Modal: Rp${data.modal}`
                );
            }
        }

        // Proses dalam transaction
        return withTransaction(async (tx) => {
            // 1. Create stok
            const stok = await tx.stokHarian.create({
                data: {
                    barangId: data.barangId,
                    harga: data.harga,
                    stok: data.stok,
                    modal: data.modal,
                    keterangan: data.keterangan,
                    tanggalEdar,
                },
                include: {
                    barang: true,
                },
            });

            // 2. Jika modal > 0, catat sebagai pengeluaran dan kurangi saldo
            if (data.modal > 0) {
                // Catat ke histori keuangan
                await keuanganRepository.createDetailKeuangan(tx, {
                    title: `Modal: ${barang.nama}`,
                    tipe: 'PENGELUARAN',
                    nominal: data.modal,
                    keterangan: `Stok ${data.stok} pcs @ Rp${data.harga}`,
                });

                // Kurangi saldo
                await keuanganRepository.updateSaldo(tx, -data.modal);
            }

            return stok;
        });
    }

    /**
     * Get stok hari ini dengan perhitungan jumlah_ambil dan jumlah_setor
     */
    async getStokHariIni() {
        const stokList = await stokRepository.findTodayWithDetails();

        // Calculate jumlah_ambil dan jumlah_setor untuk setiap stok
        return stokList.map(stok => {
            let jumlah_ambil = 0;
            const uniqueSetorUsers = new Set<number>();

            if (stok.detailSetor) {
                for (const detail of stok.detailSetor) {
                    jumlah_ambil += detail.qty;
                    if (detail.tanggalSetor) {
                        // Count unique users who have deposited
                        // Using any casting because repository includes related data but types might not be regenerated yet
                        uniqueSetorUsers.add((detail as any).ambilBarang.userId);
                    }
                }
            }

            return {
                ...stok,
                jumlah_ambil,
                jumlah_setor: uniqueSetorUsers.size,
            };
        });
    }

    /**
     * Get histori stok dengan filter
     */
    async getHistoriStok(options: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        barangId?: number;
    } = {}) {
        const { page, limit, startDate, endDate, barangId } = options;

        const result = await stokRepository.findHistori({
            page,
            limit,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            barangId
        });

        // Calculate jumlah_ambil and jumlah_setor for each stok
        const dataWithStats = result.data.map(stok => {
            let jumlah_ambil = 0;
            const uniqueSetorUsers = new Set<number>();

            if ((stok as any).detailSetor) {
                for (const detail of (stok as any).detailSetor) {
                    jumlah_ambil += detail.qty;
                    if (detail.tanggalSetor) {
                        uniqueSetorUsers.add(detail.ambilBarang.userId);
                    }
                }
            }

            return {
                ...stok,
                jumlah_ambil,
                jumlah_setor: uniqueSetorUsers.size,
            };
        });

        return { data: dataWithStats, total: result.total };
    }

    /**
     * Get stok by ID
     */
    async getStokById(id: number) {
        const stok = await stokRepository.findById(id);

        if (!stok) {
            throw new NotFoundError(`Stok dengan ID ${id} tidak ditemukan`);
        }

        return stok;
    }

    /**
     * Get stok by ID with user details (who took/deposited)
     */
    async getStokByIdWithUsers(id: number) {
        const stok = await stokRepository.findByIdWithUsers(id);

        if (!stok) {
            throw new NotFoundError(`Stok dengan ID ${id} tidak ditemukan`);
        }

        // Calculate stats and group users
        let jumlah_ambil = 0;
        const uniqueSetorUsers = new Set<number>();

        // Group by user with their transactions
        const userTransactions: {
            [userId: number]: {
                user: { id: number; nama_lengkap: string; username: string; role: string };
                items: {
                    id: number;
                    qty: number;
                    totalHarga: number;
                    status: 'ambil' | 'setor';
                    tanggalAmbil: Date;
                    tanggalSetor: Date | null;
                }[];
                totalAmbil: number;
                totalSetor: number;
            }
        } = {};

        if ((stok as any).detailSetor) {
            for (const detail of (stok as any).detailSetor) {
                jumlah_ambil += detail.qty;

                const userId = detail.ambilBarang.user.id;

                if (!userTransactions[userId]) {
                    userTransactions[userId] = {
                        user: detail.ambilBarang.user,
                        items: [],
                        totalAmbil: 0,
                        totalSetor: 0,
                    };
                }

                userTransactions[userId].items.push({
                    id: detail.id,
                    qty: detail.qty,
                    totalHarga: detail.totalHarga,
                    status: detail.tanggalSetor ? 'setor' : 'ambil',
                    tanggalAmbil: detail.ambilBarang.tanggalAmbil,
                    tanggalSetor: detail.tanggalSetor,
                });

                userTransactions[userId].totalAmbil += detail.qty;
                if (detail.tanggalSetor) {
                    userTransactions[userId].totalSetor += detail.qty;
                    uniqueSetorUsers.add(userId);
                }
            }
        }

        // Convert to array
        const users = Object.values(userTransactions);

        return {
            ...stok,
            jumlah_ambil,
            jumlah_setor: uniqueSetorUsers.size,
            users,
        };
    }

    /**
     * Update stok harian
     * - Jika modal berubah, adjust saldo sesuai selisih
     */
    async updateStokHarian(id: number, data: {
        harga?: number;
        stok?: number;
        modal?: number;
        keterangan?: string;
    }) {
        // Get existing stok
        const existingStok = await stokRepository.findById(id);
        if (!existingStok) {
            throw new NotFoundError(`Stok dengan ID ${id} tidak ditemukan`);
        }

        // Validasi
        if (data.harga !== undefined && data.harga <= 0) {
            throw new ValidationError('Harga harus lebih dari 0');
        }
        if (data.stok !== undefined && data.stok < 0) {
            throw new ValidationError('Stok tidak boleh negatif');
        }
        if (data.modal !== undefined && data.modal < 0) {
            throw new ValidationError('Modal tidak boleh negatif');
        }

        // Calculate modal difference
        const oldModal = existingStok.modal;
        const newModal = data.modal !== undefined ? data.modal : oldModal;
        const modalDiff = newModal - oldModal; // positive = tambah pengeluaran, negative = refund

        // If modal increases, check saldo
        if (modalDiff > 0) {
            await keuanganRepository.initializeSaldo();
            const currentSaldo = await keuanganRepository.getSaldo();
            if (!currentSaldo || currentSaldo.totalSaldo < modalDiff) {
                throw new ValidationError(
                    `Saldo tidak mencukupi untuk penambahan modal. Saldo: Rp${currentSaldo?.totalSaldo || 0}, Tambahan: Rp${modalDiff}`
                );
            }
        }

        // Process in transaction
        return withTransaction(async (tx) => {
            // 1. Update stok
            const updatedStok = await stokRepository.update(tx, id, data);

            // 2. If modal changed, adjust saldo
            if (modalDiff !== 0) {
                if (modalDiff > 0) {
                    // Modal naik -> tambah pengeluaran
                    await keuanganRepository.createDetailKeuangan(tx, {
                        title: `Tambahan Modal: ${existingStok.barang.nama}`,
                        tipe: 'PENGELUARAN',
                        nominal: modalDiff,
                        keterangan: `Edit stok - modal naik dari Rp${oldModal} ke Rp${newModal}`,
                    });
                    await keuanganRepository.updateSaldo(tx, -modalDiff);
                } else {
                    // Modal turun -> refund (pemasukan)
                    const refundAmount = Math.abs(modalDiff);
                    await keuanganRepository.createDetailKeuangan(tx, {
                        title: `Refund Modal: ${existingStok.barang.nama}`,
                        tipe: 'PEMASUKAN',
                        nominal: refundAmount,
                        keterangan: `Edit stok - modal turun dari Rp${oldModal} ke Rp${newModal}`,
                    });
                    await keuanganRepository.updateSaldo(tx, refundAmount);
                }
            }

            return updatedStok;
        });
    }

    /**
     * Delete stok harian
     * - Refund modal ke saldo
     */
    async deleteStokHarian(id: number) {
        // Get existing stok
        const existingStok = await stokRepository.findById(id);
        if (!existingStok) {
            throw new NotFoundError(`Stok dengan ID ${id} tidak ditemukan`);
        }

        // Check if stok has been taken (ada detailSetor)
        const hasDetailSetor = await stokRepository.hasDetailSetor(id);
        if (hasDetailSetor) {
            throw new ValidationError(
                'Tidak dapat menghapus stok yang sudah diambil. Hapus pengambilan terlebih dahulu.'
            );
        }

        const modalToRefund = existingStok.modal;

        // Process in transaction
        return withTransaction(async (tx) => {
            // 1. Delete stok
            await stokRepository.delete(tx, id);

            // 2. Refund modal jika ada
            if (modalToRefund > 0) {
                await keuanganRepository.createDetailKeuangan(tx, {
                    title: `Refund Modal: ${existingStok.barang.nama}`,
                    tipe: 'PEMASUKAN',
                    nominal: modalToRefund,
                    keterangan: `Stok dihapus - refund modal`,
                });
                await keuanganRepository.updateSaldo(tx, modalToRefund);
            }

            return {
                message: 'Stok berhasil dihapus',
                refundedModal: modalToRefund,
            };
        });
    }
}

export const stokService = new StokService();
