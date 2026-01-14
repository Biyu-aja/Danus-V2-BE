import { authRepository } from '../repositories/auth.repository';
import { ValidationError, NotFoundError } from '../utils/error';

export class AuthService {
    /**
     * Login user
     * Note: Dalam production, gunakan bcrypt untuk compare password
     */
    async login(username: string, password: string) {
        // Validasi input
        if (!username || username.trim() === '') {
            throw new ValidationError('Username tidak boleh kosong');
        }
        if (!password || password.trim() === '') {
            throw new ValidationError('Password tidak boleh kosong');
        }

        // Find user
        const user = await authRepository.findByUsernameForAuth(username);

        if (!user) {
            throw new NotFoundError('Username tidak ditemukan');
        }

        // Check password (plain text untuk development)
        // TODO: Gunakan bcrypt.compare() untuk production
        if (user.password !== password) {
            throw new ValidationError('Password salah');
        }

        // Return user tanpa password
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
        };
    }
}

export const authService = new AuthService();
