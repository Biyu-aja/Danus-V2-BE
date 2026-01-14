import { Router } from 'express';
import { getAllBarang, getAllBarangWithDeleted, getBarangById, createBarang, updateBarang, deleteBarang, restoreBarang } from '../controllers/barang.controller';

const router = Router();

/**
 * @route GET /api/barang
 * @desc Get all barang
 */
router.get('/', getAllBarang);

/**
 * @route POST /api/barang
 * @desc Create barang baru
 */
router.post('/', createBarang);

/**
 * @route GET /api/barang/with-deleted
 * @desc Get all barang termasuk yang sudah dihapus (untuk filter histori)
 */
router.get('/with-deleted', getAllBarangWithDeleted);

/**
 * @route GET /api/barang/:id
 * @desc Get barang by ID
 */
router.get('/:id', getBarangById);

/**
 * @route PUT /api/barang/:id
 * @desc Update barang
 */
router.put('/:id', updateBarang);

/**
 * @route DELETE /api/barang/:id
 * @desc Delete barang
 */
router.delete('/:id', deleteBarang);

/**
 * @route PATCH /api/barang/:id/restore
 * @desc Restore barang yang sudah dihapus
 */
router.patch('/:id/restore', restoreBarang);

export default router;
