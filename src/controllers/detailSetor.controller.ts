import { Request, Response } from 'express';
import { asyncHandler } from '../utils/error';
import { successResponse } from '../utils/response';
import { detailSetorService } from '../services/detailSetor.service';

/**
 * Get detail setor by ID
 */
export const getDetailSetorById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const detailSetor = await detailSetorService.getDetailSetorById(id);
    return successResponse(res, detailSetor, 'Detail transaksi berhasil diambil');
});

/**
 * Update detail setor qty
 */
export const updateDetailSetorQty = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { qty } = req.body;

    if (qty === undefined || qty === null) {
        return res.status(400).json({
            success: false,
            message: 'Qty harus diisi',
        });
    }

    const detailSetor = await detailSetorService.updateDetailSetorQty(id, parseInt(qty, 10));
    return successResponse(res, detailSetor, 'Transaksi berhasil diupdate');
});

/**
 * Delete detail setor
 */
export const deleteDetailSetor = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const result = await detailSetorService.deleteDetailSetor(id);
    return successResponse(res, result, 'Transaksi berhasil dihapus');
});
