import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import app from './app';
import { prisma } from './utils/transaction';

const PORT = process.env.PORT || 3000;

async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Start server
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Danus OSIS Backend API                           ║
║                                                       ║
║   Server running on: http://localhost:${PORT}            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║                                                       ║
║   Available endpoints:                                ║
║   • GET    /health                                    ║
║   • GET    /api/users                                 ║
║   • GET    /api/users/:id                             ║
║   • GET    /api/barang                                ║
║   • GET    /api/barang/:id                            ║
║   • POST   /api/stok                                  ║
║   • GET    /api/stok/hari-ini                         ║
║   • GET    /api/stok/histori                          ║
║   • POST   /api/ambil-barang                          ║
║   • GET    /api/ambil-barang/belum-setor              ║
║   • GET    /api/ambil-barang/user/:userId             ║
║   • GET    /api/ambil-barang/:id                      ║
║   • POST   /api/setor                                 ║
║   • GET    /api/keuangan/saldo                        ║
║   • GET    /api/keuangan/histori                      ║
║   • POST   /api/keuangan/pengeluaran                  ║
║   • GET    /api/keuangan/laporan/harian               ║
║   • GET    /api/keuangan/laporan/bulanan              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});

main();
