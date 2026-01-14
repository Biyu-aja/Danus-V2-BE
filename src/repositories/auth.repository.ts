import { prisma } from '../utils/transaction';

export class AuthRepository {
    /**
     * Find user by username for auth (include password)
     */
    async findByUsernameForAuth(username: string) {
        return prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                nama_lengkap: true,
                username: true,
                nomor_telepon: true,
                password: true,
                role: true,
                catatan: true,
            },
        });
    }
}

export const authRepository = new AuthRepository();
