import { Request, Response, NextFunction } from 'express';
import { requestSetorService } from '../services/request.service';

export const createRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, adminId, items } = req.body;

        if (!userId) {
            throw new Error('UserId is required');
        }

        const request = await requestSetorService.createRequest({
            userId: Number(userId),
            adminId: Number(adminId),
            items
        });

        res.status(201).json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
};

export const getMyRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.query.userId;

        if (!userId) {
            throw new Error('UserId query param is required');
        }

        const requests = await requestSetorService.getRequests({ userId: Number(userId) });

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

export const getAdminRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.query.adminId;

        if (!adminId) {
            throw new Error('AdminId query param is required');
        }

        // Maybe also filter by status?
        const requests = await requestSetorService.getRequests({ adminId: Number(adminId), status: 'PENDING' });

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

export const approveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await requestSetorService.approveRequest(Number(id));

        res.status(200).json({
            success: true,
            message: 'Request approved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await requestSetorService.rejectRequest(Number(id));

        res.status(200).json({
            success: true,
            message: 'Request rejected successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
