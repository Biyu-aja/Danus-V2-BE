import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

/**
 * Send success response
 */
export const successResponse = <T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
export const paginatedResponse = <T>(
    res: Response,
    data: T[],
    pagination: { page: number; limit: number; total: number },
    message: string = 'Success'
): Response => {
    const response: PaginatedResponse<T> = {
        success: true,
        message,
        data,
        pagination: {
            ...pagination,
            totalPages: Math.ceil(pagination.total / pagination.limit),
        },
    };
    return res.status(200).json(response);
};

/**
 * Send error response
 */
export const errorResponse = (
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: string
): Response => {
    const response: ApiResponse = {
        success: false,
        message,
        error,
    };
    return res.status(statusCode).json(response);
};
