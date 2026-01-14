import { Request, Response, NextFunction } from 'express';
import { errorResponse } from './response';

/**
 * Custom App Error class
 */
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource tidak ditemukan') {
        super(message, 404);
    }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
    constructor(message: string = 'Validasi gagal') {
        super(message, 400);
    }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Data konflik') {
        super(message, 409);
    }
}

/**
 * Insufficient Stock Error (400)
 */
export class InsufficientStockError extends AppError {
    constructor(message: string = 'Stok tidak mencukupi') {
        super(message, 400);
    }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        return errorResponse(res, err.message, err.statusCode);
    }

    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        return errorResponse(res, 'Database error', 400);
    }

    // Default error
    return errorResponse(
        res,
        'Internal server error',
        500,
        process.env.NODE_ENV === 'development' ? err.message : undefined
    );
};

/**
 * Async handler wrapper untuk menghindari try-catch berulang
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
