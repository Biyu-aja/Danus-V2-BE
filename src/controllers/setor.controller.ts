import { Request, Response } from 'express';
import { setorService } from '../services/setor.service';
import { successResponse } from '../utils/response';
import { asyncHandler, ValidationError } from '../utils/error';
import { ProsesSetorRequest } from '../types';

/**
 * POST /api/setor
 * Proses setor barang
 * 
 * CRITICAL ENDPOINT - Atomic transaction
 */
export const prosesSetor = asyncHandler(async (req: Request, res: Response) => {
    const data: ProsesSetorRequest = req.body;

    // Validation for new format (items)
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        // Valid
    }
    // Validation for old format (backward compatibility)
    else if (data.detailSetorIds && Array.isArray(data.detailSetorIds) && data.detailSetorIds.length > 0) {
        // Map old format to new format
        data.items = data.detailSetorIds.map(id => ({ detailSetorId: id, qty: -1 })); // -1 indicates full qty needs fetch
        // Note: The service will handle full qty fetch or validation error if mixed.
        // Actually, service throws error for mixed. Let's redirect to new format completely.
        // But for safety, let service handle it.
    } else {
        throw new ValidationError('Items wajib diisi');
    }

    const result = await setorService.prosesSetor(data);
    return successResponse(res, result, 'Berhasil memproses setor');
});
