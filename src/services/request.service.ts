import { prisma } from '../utils/transaction';
import { setorService } from './setor.service';
import { BadRequestError, NotFoundError } from '../utils/error';

interface CreateRequestItem {
    detailSetorId: number;
    qty: number;
}

interface CreateRequestParams {
    userId: number;
    adminId: number;
    items: CreateRequestItem[];
}

export class RequestSetorService {
    async createRequest(data: CreateRequestParams) {
        const { userId, adminId, items } = data;

        if (!items || items.length === 0) {
            throw new BadRequestError('Items cannot be empty');
        }

        // Verify items exist and belong to user
        const details = await prisma.detailSetor.findMany({
            where: {
                id: { in: items.map(i => i.detailSetorId) },
                ambilBarang: {
                    userId: userId
                }
            },
            include: {
                ambilBarang: true
            }
        });

        if (details.length !== items.length) {
            throw new BadRequestError('One or more items invalid or do not belong to user');
        }

        // Get existing pending requests for these items to calculate remaining available qty
        const pendingRequestDetails = await prisma.detailRequestSetor.findMany({
            where: {
                detailSetorId: {
                    in: items.map(i => i.detailSetorId)
                },
                request: {
                    status: 'PENDING'
                }
            }
        });

        // Validation: Check quantity and if already paid (including pending)
        for (const item of items) {
            const detail = details.find(d => d.id === item.detailSetorId);
            if (!detail) continue;

            if (detail.tanggalSetor) {
                throw new BadRequestError(`Item ${detail.id} is already deposited`);
            }

            // Calculate total pending qty for this item
            const totalPendingQty = pendingRequestDetails
                .filter(p => p.detailSetorId === item.detailSetorId)
                .reduce((sum, p) => sum + p.qty, 0);

            const totalRequestedQty = totalPendingQty + item.qty;

            if (totalRequestedQty > detail.qty) {
                throw new BadRequestError(
                    `Requested quantity (${item.qty}) + Pending (${totalPendingQty}) exceeds available quantity (${detail.qty}) for item ${detail.id}`
                );
            }
        }

        // Create the request
        return prisma.requestSetor.create({
            data: {
                userId,
                adminId,
                status: 'PENDING',
                details: {
                    create: items.map(item => ({
                        detailSetorId: item.detailSetorId,
                        qty: item.qty
                    }))
                }
            },
            include: {
                details: {
                    include: {
                        detailSetor: {
                            include: {
                                stokHarian: {
                                    include: {
                                        barang: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async getRequests({ userId, adminId, status }: { userId?: number, adminId?: number, status?: string }) {
        return prisma.requestSetor.findMany({
            where: {
                userId,
                adminId,
                status
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true
                    }
                },
                admin: {
                    select: {
                        id: true,
                        nama_lengkap: true
                    }
                },
                details: {
                    include: {
                        detailSetor: {
                            include: {
                                stokHarian: {
                                    include: {
                                        barang: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async approveRequest(requestId: number) {
        const request = await prisma.requestSetor.findUnique({
            where: { id: requestId },
            include: { details: true }
        });

        if (!request) {
            throw new NotFoundError('Request not found');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestError('Request is not pending');
        }


        // Call SetorService to process the deposit within a transaction
        return prisma.$transaction(async (tx) => {
            await setorService.prosesSetor({
                adminId: request.adminId,
                items: request.details.map(d => ({
                    detailSetorId: d.detailSetorId,
                    qty: d.qty
                }))
            }, tx); // Pass transaction context

            return tx.requestSetor.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED'
                }
            });
        });
    }

    async rejectRequest(requestId: number) {
        const request = await prisma.requestSetor.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            throw new NotFoundError('Request not found');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestError('Request is not pending');
        }

        return prisma.requestSetor.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED'
            }
        });
    }
}

export const requestSetorService = new RequestSetorService();
