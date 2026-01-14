import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export type TransactionClient = Prisma.TransactionClient;

/**
 * Execute operations within a database transaction
 * Ensures all operations succeed or all fail (atomic)
 */
export const withTransaction = async <T>(
    operations: (tx: TransactionClient) => Promise<T>
): Promise<T> => {
    return prisma.$transaction(async (tx) => {
        return operations(tx);
    });
};

export { prisma };
