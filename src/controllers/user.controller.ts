import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/error';

/**
 * GET /api/users
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    return successResponse(res, users, 'Berhasil mendapatkan data users');
});

/**
 * GET /api/users/status-hari-ini
 * Get all users with today's ambil barang status
 */
export const getUsersWithTodayStatus = asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getUsersWithTodayStatus();
    return successResponse(res, users, 'Berhasil mendapatkan status user hari ini');
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const user = await userService.getUserById(id);
    return successResponse(res, user, 'Berhasil mendapatkan data user');
});

/**
 * GET /api/users/:id/stats
 * Get user monthly stats
 */
export const getUserMonthlyStats = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);

    const stats = await userService.getUserMonthlyStats(id, year, month);
    return successResponse(res, stats, 'Berhasil mendapatkan statistik user');
});
