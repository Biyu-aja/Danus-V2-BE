import { Router } from 'express';
import {
    getSaldo,
    getHistoriTransaksi,
    getHistoriByMonth,
    createPengeluaran,
    createPemasukan,
    getLaporanHarian,
    getLaporanBulanan,
    getDetailKeuanganById,
    deleteDetailKeuangan,
} from '../controllers/keuangan.controller';

const router = Router();

/**
 * @route GET /api/keuangan/saldo
 * @desc Get saldo terkini
 */
router.get('/saldo', getSaldo);

/**
 * @route GET /api/keuangan/histori
 * @desc Get histori transaksi
 */
router.get('/histori', getHistoriTransaksi);

/**
 * @route GET /api/keuangan/histori/bulanan
 * @desc Get histori transaksi berdasarkan bulan
 */
router.get('/histori/bulanan', getHistoriByMonth);

/**
 * @route POST /api/keuangan/pengeluaran
 * @desc Catat pengeluaran manual
 */
router.post('/pengeluaran', createPengeluaran);

/**
 * @route POST /api/keuangan/pemasukan
 * @desc Catat pemasukan manual
 */
router.post('/pemasukan', createPemasukan);

/**
 * @route GET /api/keuangan/laporan/harian
 * @desc Get laporan harian
 */
router.get('/laporan/harian', getLaporanHarian);

/**
 * @route GET /api/keuangan/laporan/bulanan
 * @desc Get laporan bulanan
 */
router.get('/laporan/bulanan', getLaporanBulanan);

/**
 * @route GET /api/keuangan/:id
 * @desc Get detail keuangan by ID
 */
router.get('/:id', getDetailKeuanganById);

/**
 * @route DELETE /api/keuangan/:id
 * @desc Delete detail keuangan (only last transaction)
 */
router.delete('/:id', deleteDetailKeuangan);

export default router;
