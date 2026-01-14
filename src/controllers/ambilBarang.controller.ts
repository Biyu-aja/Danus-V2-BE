import { Request, Response } from 'express';
import { ambilBarangService } from '../services/ambilBarang.service';
import { successResponse } from '../utils/response';
import { asyncHandler, ValidationError } from '../utils/error';
import { CreateAmbilBarangRequest } from '../types';

/**
 * POST /api/ambil-barang
 * Create ambil barang baru
 */
export const createAmbilBarang = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateAmbilBarangRequest = req.body;

    // Basic validation
    if (!data.userId) {
        throw new ValidationError('userId wajib diisi');
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        throw new ValidationError('Items wajib diisi dan tidak boleh kosong');
    }

    const ambilBarang = await ambilBarangService.createAmbilBarang(data);
    return successResponse(res, ambilBarang, 'Berhasil membuat ambil barang', 201);
});

/**
 * GET /api/ambil-barang/user/:userId
 * Get ambil barang by user ID
 */
export const getAmbilBarangByUserId = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    const ambilBarang = await ambilBarangService.getAmbilBarangByUserId(userId);
    return successResponse(res, ambilBarang, 'Berhasil mendapatkan data ambil barang');
});

/**
 * GET /api/ambil-barang/belum-setor
 * Get ambil barang yang belum setor
 */
export const getAmbilBarangBelumSetor = asyncHandler(async (req: Request, res: Response) => {
    const ambilBarang = await ambilBarangService.getAmbilBarangBelumSetor();
    return successResponse(res, ambilBarang, 'Berhasil mendapatkan data ambil barang belum setor');
});

/**
 * GET /api/ambil-barang/:id
 * Get ambil barang by ID
 */
export const getAmbilBarangById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const ambilBarang = await ambilBarangService.getAmbilBarangById(id);
    return successResponse(res, ambilBarang, 'Berhasil mendapatkan data ambil barang');
});

/**
 * PATCH /api/ambil-barang/:id/keterangan
 * Update keterangan ambil barang
 */
export const updateKeterangan = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { keterangan } = req.body;

    const ambilBarang = await ambilBarangService.updateKeterangan(id, keterangan || '');
    return successResponse(res, ambilBarang, 'Berhasil mengupdate keterangan');
});
