import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/error';

/**
 * POST /api/auth/login
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    return successResponse(res, result, 'Login berhasil');
});
