import { setorRepository } from '../repositories/setor.repository';
import { stokRepository } from '../repositories/stok.repository';
import { keuanganRepository } from '../repositories/keuangan.repository';
import { ambilBarangRepository } from '../repositories/ambilBarang.repository';
import { withTransaction } from '../utils/transaction';
import { NotFoundError, ValidationError, ConflictError } from '../utils/error';
import { ProsesSetorRequest } from '../types';

export class SetorService {
    /**
     * Proses setor barang
     * CRITICAL: Harus atomic dalam satu transaction
     * 
     * Langkah:
     * 1. Validasi qty & stok
     * 2. Tandai detail setor sebagai disetor
     * 3. Catat pemasukan ke histori keuangan
     * 4. Update saldo kas
     * 5. Kurangi stok harian
     * 6. Jika semua detail sudah disetor → update status ambil barang
     */
    async prosesSetor(data: ProsesSetorRequest) {
        // Handle backward compatibility or new format
        const items = data.items || [];
        const adminId = data.adminId;

        // Validation
        if (items.length === 0) {
            // Check old format
            if (data.detailSetorIds && data.detailSetorIds.length > 0) {
                // Convert old format to new format (assuming full qty)
                // But we need to fetch them first to know qty. 
                // Let's assume frontend sends new format.
                throw new ValidationError('Format request tidak valid. Gunakan items: { detailSetorId, qty }[]');
            }
            throw new ValidationError('Items tidak boleh kosong');
        }

        const detailIds = items.map(i => i.detailSetorId);

        // Get existing details
        const existingDetails = await setorRepository.findDetailSetorByIds(detailIds);

        // Validasi semua ID ditemukan
        if (existingDetails.length !== items.length) {
            const foundIds = existingDetails.map((d) => d.id);
            const notFoundIds = detailIds.filter((id) => !foundIds.includes(id));
            throw new NotFoundError(`Detail setor dengan ID ${notFoundIds.join(', ')} tidak ditemukan`);
        }

        // Validasi belum pernah setor & Qty
        for (const item of items) {
            const detail = existingDetails.find(d => d.id === item.detailSetorId);
            if (!detail) continue;

            if (detail.tanggalSetor !== null) {
                throw new ConflictError(`Detail setor ID ${detail.id} sudah disetor sebelumnya`);
            }

            if (item.qty <= 0) {
                throw new ValidationError(`Qty untuk ID ${detail.id} harus > 0`);
            }

            if (item.qty > detail.qty) {
                throw new ValidationError(`Qty setor (${item.qty}) melebihi qty ambil (${detail.qty}) untuk ID ${detail.id}`);
            }
        }

        // Ensure saldo record exists
        await keuanganRepository.initializeSaldo();

        // Transaction
        return withTransaction(async (tx) => {
            const results: {
                detailSetorId: number;
                barangNama: string;
                qty: number;
                totalHarga: number;
            }[] = [];

            let totalPemasukan = 0;
            const processedAmbilBarangIds = new Set<number>();

            for (const item of items) {
                const detail = existingDetails.find(d => d.id === item.detailSetorId)!;
                processedAmbilBarangIds.add(detail.ambilBarangId);

                // Calculate price per unit
                const hargaSatuan = detail.totalHarga / detail.qty;
                const hargaTotalSetor = hargaSatuan * item.qty;

                let targetDetailId = detail.id;

                // LOGIC SPLIT / FULL SETOR
                if (item.qty === detail.qty) {
                    // Full Setor
                    await setorRepository.markAsSetor(tx, detail.id);
                    targetDetailId = detail.id;
                } else {
                    // Partial Setor -> Split
                    const remainingQty = detail.qty - item.qty;
                    const remainingHarga = hargaSatuan * remainingQty; // Int logic might need floor/ceil but assuming clean numbers

                    // 1. Update old detail (Reduced) - Belum Setor
                    await setorRepository.updateQtyAndTotalHarga(tx, detail.id, remainingQty, remainingHarga);

                    // 2. Create new detail (Moved) - Sudah Setor
                    const newDetail = await setorRepository.createDetailSetor(tx, {
                        ambilBarangId: detail.ambilBarangId,
                        stokHarianId: detail.stokHarianId,
                        qty: item.qty,
                        totalHarga: hargaTotalSetor,
                        tanggalSetor: new Date()
                    });

                    targetDetailId = newDetail.id;
                }

                // Note: STOK FISIK TIDAK DIKURANGI LAGI (karena sudah dikurangi saat ambil)

                // Catat Keuangan
                await keuanganRepository.createDetailKeuangan(tx, {
                    detailSetorId: targetDetailId,
                    title: `Setor: ${detail.stokHarian.barang.nama}`,
                    tipe: 'PEMASUKAN',
                    nominal: hargaTotalSetor,
                    keterangan: `Qty: ${item.qty} x Rp${hargaSatuan} (Partial/Full)`,
                });

                totalPemasukan += hargaTotalSetor;

                results.push({
                    detailSetorId: targetDetailId,
                    barangNama: detail.stokHarian.barang.nama,
                    qty: item.qty,
                    totalHarga: hargaTotalSetor,
                });
            }

            // Update Setor Kepada (Admin) jika ada
            if (adminId) {
                for (const abId of processedAmbilBarangIds) {
                    await setorRepository.updateSetorKepada(tx, abId, adminId);
                }
            }

            // Update Status Ambil Barang
            for (const abId of processedAmbilBarangIds) {
                const allSetor = await setorRepository.isAllDetailSetor(tx, abId);
                const hasAnySetor = await setorRepository.hasAnySetor(tx, abId);

                let newStatus = 'BELUM_SETOR';
                if (allSetor) newStatus = 'SUDAH_SETOR';
                else if (hasAnySetor) newStatus = 'SEBAGIAN_SETOR';

                await ambilBarangRepository.updateStatus(tx, abId, newStatus);
            }

            // Update Saldo Kas
            const updatedSaldo = await keuanganRepository.updateSaldo(tx, totalPemasukan);

            return {
                message: 'Setor berhasil diproses',
                totalPemasukan,
                saldoTerbaru: updatedSaldo.totalSaldo,
                details: results,
            };
        });
    }
}

export const setorService = new SetorService();
