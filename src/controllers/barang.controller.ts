import { Request, Response } from 'express';
import { barangService } from '../services/barang.service';
import { successResponse } from '../utils/response';
import { asyncHandler, ValidationError } from '../utils/error';
import { CreateBarangRequest } from '../types';

/**
 * GET /api/barang
 * Get all barang
 */
export const getAllBarang = asyncHandler(async (req: Request, res: Response) => {
    const barang = await barangService.getAllBarang();
    return successResponse(res, barang, 'Berhasil mendapatkan data barang');
});

/**
 * GET /api/barang/with-deleted
 * Get all barang termasuk yang sudah dihapus (untuk filter histori)
 */
export const getAllBarangWithDeleted = asyncHandler(async (req: Request, res: Response) => {
    const barang = await barangService.getAllBarangWithDeleted();
    return successResponse(res, barang, 'Berhasil mendapatkan data barang');
});

/**
 * GET /api/barang/:id
 * Get barang by ID
 */
export const getBarangById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const barang = await barangService.getBarangById(id);
    return successResponse(res, barang, 'Berhasil mendapatkan data barang');
});

/**
 * POST /api/barang
 * Create barang baru
 */
export const createBarang = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateBarangRequest = req.body;

    // Basic validation
    if (!data.nama) {
        throw new ValidationError('Nama barang wajib diisi');
    }

    const barang = await barangService.createBarang(data);
    return successResponse(res, barang, 'Berhasil menambahkan barang', 201);
});

/**
 * PUT /api/barang/:id
 * Update barang
 */
export const updateBarang = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const data: Partial<CreateBarangRequest> = req.body;

    const barang = await barangService.updateBarang(id, data);
    return successResponse(res, barang, 'Berhasil mengupdate barang');
});

/**
 * DELETE /api/barang/:id
 * Delete barang
 */
export const deleteBarang = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await barangService.deleteBarang(id);
    return successResponse(res, null, 'Berhasil menghapus barang');
});

/**
 * PATCH /api/barang/:id/restore
 * Restore barang yang sudah dihapus
 */
export const restoreBarang = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const barang = await barangService.restoreBarang(id);
    return successResponse(res, barang, 'Berhasil mengembalikan barang');
});
