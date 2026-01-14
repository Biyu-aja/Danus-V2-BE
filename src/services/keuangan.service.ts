import { keuanganRepository } from '../repositories/keuangan.repository';
import { withTransaction } from '../utils/transaction';
import { ValidationError } from '../utils/error';
import { CreatePengeluaranRequest } from '../types';

export class KeuanganService {
    /**
     * Get saldo terkini
     */
    async getSaldo() {
        // Ensure saldo exists
        await keuanganRepository.initializeSaldo();
        return keuanganRepository.getSaldo();
    }

    /**
     * Get histori transaksi
     */
    async getHistoriTransaksi(page: number = 1, limit: number = 20) {
        return keuanganRepository.getHistori(page, limit);
    }

    /**
     * Get histori transaksi berdasarkan bulan
     */
    async getHistoriByMonth(year: number, month: number) {
        return keuanganRepository.getHistoriByMonth(year, month);
    }

    /**
     * Catat pengeluaran manual
     */
    async createPengeluaran(data: CreatePengeluaranRequest) {
        // Validasi
        if (!data.title || data.title.trim() === '') {
            throw new ValidationError('Title tidak boleh kosong');
        }
        if (data.nominal <= 0) {
            throw new ValidationError('Nominal harus lebih dari 0');
        }

        // Ensure saldo exists
        await keuanganRepository.initializeSaldo();

        // Check saldo cukup
        const currentSaldo = await keuanganRepository.getSaldo();
        if (!currentSaldo || currentSaldo.totalSaldo < data.nominal) {
            throw new ValidationError(
                `Saldo tidak mencukupi. Saldo saat ini: Rp${currentSaldo?.totalSaldo || 0}`
            );
        }

        // Proses dalam transaction
        return withTransaction(async (tx) => {
            // Catat ke histori
            await keuanganRepository.createDetailKeuangan(tx, {
                title: data.title,
                tipe: 'PENGELUARAN',
                nominal: data.nominal,
                keterangan: data.keterangan,
            });

            // Update saldo (decrement)
            const updatedSaldo = await keuanganRepository.updateSaldo(tx, -data.nominal);

            return {
                message: 'Pengeluaran berhasil dicatat',
                pengeluaran: {
                    title: data.title,
                    nominal: data.nominal,
                    keterangan: data.keterangan,
                },
                saldoTerbaru: updatedSaldo.totalSaldo,
            };
        });
    }

    /**
     * Catat pemasukan manual
     */
    async createPemasukan(data: CreatePengeluaranRequest) {
        // Validasi
        if (!data.title || data.title.trim() === '') {
            throw new ValidationError('Title tidak boleh kosong');
        }
        if (data.nominal <= 0) {
            throw new ValidationError('Nominal harus lebih dari 0');
        }

        // Ensure saldo exists
        await keuanganRepository.initializeSaldo();

        // Proses dalam transaction
        return withTransaction(async (tx) => {
            // Catat ke histori
            await keuanganRepository.createDetailKeuangan(tx, {
                title: data.title,
                tipe: 'PEMASUKAN',
                nominal: data.nominal,
                keterangan: data.keterangan,
            });

            // Update saldo (increment)
            const updatedSaldo = await keuanganRepository.updateSaldo(tx, data.nominal);

            return {
                message: 'Pemasukan berhasil dicatat',
                pemasukan: {
                    title: data.title,
                    nominal: data.nominal,
                    keterangan: data.keterangan,
                },
                saldoTerbaru: updatedSaldo.totalSaldo,
            };
        });
    }

    /**
     * Get laporan harian
     */
    async getLaporanHarian(tanggal?: string) {
        const date = tanggal ? new Date(tanggal) : new Date();

        if (isNaN(date.getTime())) {
            throw new ValidationError('Format tanggal tidak valid');
        }

        return keuanganRepository.getLaporanHarian(date);
    }

    /**
     * Get laporan bulanan
     */
    async getLaporanBulanan(bulan?: string) {
        let year: number;
        let month: number;

        if (bulan) {
            const parts = bulan.split('-');
            if (parts.length !== 2) {
                throw new ValidationError('Format bulan harus YYYY-MM');
            }
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);

            if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
                throw new ValidationError('Format bulan tidak valid');
            }
        } else {
            const now = new Date();
            year = now.getFullYear();
            month = now.getMonth() + 1;
        }

        return keuanganRepository.getLaporanBulanan(year, month);
    }

    /**
     * Get detail keuangan by ID
     */
    async getDetailKeuanganById(id: number) {
        const detail = await keuanganRepository.findById(id);
        if (!detail) {
            throw new ValidationError('Transaksi tidak ditemukan');
        }

        // Add isLastTransaction flag
        const lastTransactionId = await keuanganRepository.getLastTransactionId();
        return {
            ...detail,
            isLastTransaction: detail.id === lastTransactionId,
        };
    }

    /**
     * Delete detail keuangan (only for the last transaction, and only manual entries)
     */
    async deleteDetailKeuangan(id: number) {
        const existing = await keuanganRepository.findById(id);
        if (!existing) {
            throw new ValidationError('Transaksi tidak ditemukan');
        }

        // Only allow deleting manual entries (no linked detailSetor)
        if (existing.detailSetorId !== null) {
            throw new ValidationError('Tidak dapat menghapus transaksi dari setor barang');
        }

        // Only allow deleting the last transaction
        const lastTransactionId = await keuanganRepository.getLastTransactionId();
        if (existing.id !== lastTransactionId) {
            throw new ValidationError('Hanya transaksi terakhir yang dapat dihapus');
        }

        return withTransaction(async (tx) => {
            // Reverse the saldo effect directly (not by adding new transaction)
            if (existing.tipe === 'PEMASUKAN') {
                // Reverse pemasukan = decrement saldo
                await keuanganRepository.updateSaldo(tx, -existing.nominal);
            } else {
                // Reverse pengeluaran = increment saldo
                await keuanganRepository.updateSaldo(tx, existing.nominal);
            }

            // Delete the record
            await keuanganRepository.deleteDetailKeuangan(tx, id);

            return { success: true, message: 'Transaksi berhasil dihapus' };
        });
    }
}

export const keuanganService = new KeuanganService();
