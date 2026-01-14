import { detailSetorRepository } from '../repositories/detailSetor.repository';
import { stokRepository } from '../repositories/stok.repository';
import { ambilBarangRepository } from '../repositories/ambilBarang.repository';
import { withTransaction } from '../utils/transaction';
import { NotFoundError, ValidationError } from '../utils/error';

export class DetailSetorService {
    /**
     * Get detail setor by ID
     */
    async getDetailSetorById(id: number) {
        const detailSetor = await detailSetorRepository.findById(id);

        if (!detailSetor) {
            throw new NotFoundError(`Detail Setor dengan ID ${id} tidak ditemukan`);
        }

        return detailSetor;
    }

    /**
     * Update qty of detail setor (only if it's the last transaction and not yet deposited)
     */
    async updateDetailSetorQty(id: number, newQty: number) {
        const detailSetor = await detailSetorRepository.findById(id);

        if (!detailSetor) {
            throw new NotFoundError(`Detail Setor dengan ID ${id} tidak ditemukan`);
        }

        // Check if already deposited
        if (detailSetor.tanggalSetor !== null) {
            throw new ValidationError('Tidak dapat mengedit transaksi yang sudah disetor');
        }

        // Check if this is the last transaction
        const userId = detailSetor.ambilBarang.user.id;
        const stokHarianId = detailSetor.stokHarianId;
        const isLast = await detailSetorRepository.isLastTransaction(id, userId, stokHarianId);

        if (!isLast) {
            throw new ValidationError('Hanya transaksi terakhir yang dapat diedit');
        }

        // Validate qty
        if (newQty <= 0) {
            throw new ValidationError('Quantity harus lebih dari 0');
        }

        const oldQty = detailSetor.qty;
        const qtyDiff = newQty - oldQty;

        // Check if enough stock available for increase
        if (qtyDiff > 0) {
            const stok = await stokRepository.findById(stokHarianId);
            if (!stok || stok.stok < qtyDiff) {
                throw new ValidationError(`Stok tidak mencukupi. Tersedia: ${stok?.stok || 0}`);
            }
        }

        // Calculate new total price
        const newTotalHarga = detailSetor.stokHarian.harga * newQty;

        // Update in transaction
        return withTransaction(async (tx) => {
            // Adjust stock
            if (qtyDiff > 0) {
                // Increase qty = decrease stock
                await tx.stokHarian.update({
                    where: { id: stokHarianId },
                    data: { stok: { decrement: qtyDiff } },
                });
            } else if (qtyDiff < 0) {
                // Decrease qty = increase stock
                await tx.stokHarian.update({
                    where: { id: stokHarianId },
                    data: { stok: { increment: Math.abs(qtyDiff) } },
                });
            }

            // Update detail setor
            const updated = await detailSetorRepository.updateQty(tx, id, newQty, newTotalHarga);

            return updated;
        });
    }

    /**
     * Delete detail setor (only if it's the last transaction and not yet deposited)
     */
    async deleteDetailSetor(id: number) {
        const detailSetor = await detailSetorRepository.findById(id);

        if (!detailSetor) {
            throw new NotFoundError(`Detail Setor dengan ID ${id} tidak ditemukan`);
        }

        // Check if already deposited
        if (detailSetor.tanggalSetor !== null) {
            throw new ValidationError('Tidak dapat menghapus transaksi yang sudah disetor');
        }

        // Check if this is the last transaction
        const userId = detailSetor.ambilBarang.user.id;
        const stokHarianId = detailSetor.stokHarianId;
        const isLast = await detailSetorRepository.isLastTransaction(id, userId, stokHarianId);

        if (!isLast) {
            throw new ValidationError('Hanya transaksi terakhir yang dapat dihapus');
        }

        const qty = detailSetor.qty;
        const ambilBarangId = detailSetor.ambilBarangId;

        // Delete in transaction
        return withTransaction(async (tx) => {
            // Return stock
            await tx.stokHarian.update({
                where: { id: stokHarianId },
                data: { stok: { increment: qty } },
            });

            // Delete detail setor
            await detailSetorRepository.delete(tx, id);

            // Check if ambilBarang has any remaining detailSetor
            const remainingCount = await detailSetorRepository.countByAmbilBarangId(ambilBarangId);

            if (remainingCount === 0) {
                // Delete the parent ambilBarang if no items left
                await tx.ambilBarang.delete({
                    where: { id: ambilBarangId },
                });
            }

            return { success: true, message: 'Transaksi berhasil dihapus' };
        });
    }
}

export const detailSetorService = new DetailSetorService();
