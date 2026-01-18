import { Router } from 'express';
import { getAllUsers, getUserById, getUsersWithTodayStatus, getUserMonthlyStats, updateUser } from '../controllers/user.controller';

const router = Router();

/**
 * @route GET /api/users
 * @desc Get all users
 */
router.get('/', getAllUsers);

/**
 * @route GET /api/users/status-hari-ini
 * @desc Get all users with today's ambil barang status
 */
router.get('/status-hari-ini', getUsersWithTodayStatus);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 */
router.get('/:id', getUserById);

/**
 * @route GET /api/users/:id/stats
 * @desc Get user monthly stats
 */
router.get('/:id/stats', getUserMonthlyStats);

/**
 * @route PATCH /api/users/:id
 * @desc Update user data (phone number and notes)
 */
router.patch('/:id', updateUser);

export default router;
