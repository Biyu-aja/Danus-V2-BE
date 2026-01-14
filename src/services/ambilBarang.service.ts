import { ambilBarangRepository } from '../repositories/ambilBarang.repository';
import { stokRepository } from '../repositories/stok.repository';
import { userRepository } from '../repositories/user.repository';
import { withTransaction } from '../utils/transaction';
import { NotFoundError, ValidationError, InsufficientStockError } from '../utils/error';
import { CreateAmbilBarangRequest } from '../types';

export class AmbilBarangService {
    /**
     * Create ambil barang baru
     */
    async createAmbilBarang(data: CreateAmbilBarangRequest) {
        // Validasi user exists
        const user = await userRepository.findById(data.userId);
        if (!user) {
            throw new NotFoundError(`User dengan ID ${data.userId} tidak ditemukan`);
        }

        // Validasi items tidak kosong
        if (!data.items || data.items.length === 0) {
            throw new ValidationError('Items tidak boleh kosong');
        }

        // Validasi setiap item
        const itemsWithPrice: {
            stokHarianId: number;
            qty: number;
            totalHarga: number;
        }[] = [];

        for (const item of data.items) {
            if (item.qty <= 0) {
                throw new ValidationError('Quantity harus lebih dari 0');
            }

            const stok = await stokRepository.findById(item.stokHarianId);
            if (!stok) {
                throw new NotFoundError(`Stok dengan ID ${item.stokHarianId} tidak ditemukan`);
            }

            if (stok.stok < item.qty) {
                throw new InsufficientStockError(
                    `Stok ${stok.barang.nama} tidak mencukupi. Tersedia: ${stok.stok}, Diminta: ${item.qty}`
                );
            }

            itemsWithPrice.push({
                stokHarianId: item.stokHarianId,
                qty: item.qty,
                totalHarga: stok.harga * item.qty,
            });
        }

        // Create dalam transaction
        return withTransaction(async (tx) => {
            // Kurangi stok untuk setiap item
            for (const item of itemsWithPrice) {
                await stokRepository.decrementStok(tx, item.stokHarianId, item.qty);
            }

            // Create ambil barang dengan detail
            const ambilBarang = await ambilBarangRepository.create(tx, {
                userId: data.userId,
                setorKepadaId: data.setorKepadaId,
                keterangan: data.keterangan,
                items: itemsWithPrice,
            });

            return ambilBarang;
        });
    }

    /**
     * Get ambil barang by user ID
     */
    async getAmbilBarangByUserId(userId: number) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError(`User dengan ID ${userId} tidak ditemukan`);
        }

        return ambilBarangRepository.findByUserId(userId);
    }

    /**
     * Get ambil barang yang belum setor
     */
    async getAmbilBarangBelumSetor() {
        return ambilBarangRepository.findBelumSetor();
    }

    /**
     * Get ambil barang by ID
     */
    async getAmbilBarangById(id: number) {
        const ambilBarang = await ambilBarangRepository.findById(id);

        if (!ambilBarang) {
            throw new NotFoundError(`Ambil Barang dengan ID ${id} tidak ditemukan`);
        }

        return ambilBarang;
    }

    /**
     * Update keterangan ambil barang
     */
    async updateKeterangan(id: number, keterangan: string) {
        const ambilBarang = await ambilBarangRepository.findById(id);

        if (!ambilBarang) {
            throw new NotFoundError(`Ambil Barang dengan ID ${id} tidak ditemukan`);
        }

        return ambilBarangRepository.updateKeterangan(id, keterangan);
    }
}

export const ambilBarangService = new AmbilBarangService();
