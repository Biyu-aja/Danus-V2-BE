-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "nomor_telepon" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "catatan" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barang" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "Barang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StokHarian" (
    "id" SERIAL NOT NULL,
    "barangId" INTEGER NOT NULL,
    "harga" INTEGER NOT NULL,
    "stok" INTEGER NOT NULL,
    "modal" INTEGER NOT NULL,
    "keterangan" TEXT,
    "tanggalEdar" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StokHarian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbilBarang" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "setorKepadaId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BELUM_SETOR',
    "keterangan" TEXT,
    "tanggalAmbil" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbilBarang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailSetor" (
    "id" SERIAL NOT NULL,
    "ambilBarangId" INTEGER NOT NULL,
    "stokHarianId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "totalHarga" INTEGER NOT NULL,
    "tanggalSetor" TIMESTAMP(3),

    CONSTRAINT "DetailSetor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keuangan" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "totalSaldo" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keuangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailKeuangan" (
    "id" SERIAL NOT NULL,
    "detailSetorId" INTEGER,
    "title" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetailKeuangan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DetailKeuangan_detailSetorId_key" ON "DetailKeuangan"("detailSetorId");

-- AddForeignKey
ALTER TABLE "StokHarian" ADD CONSTRAINT "StokHarian_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbilBarang" ADD CONSTRAINT "AmbilBarang_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbilBarang" ADD CONSTRAINT "AmbilBarang_setorKepadaId_fkey" FOREIGN KEY ("setorKepadaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailSetor" ADD CONSTRAINT "DetailSetor_ambilBarangId_fkey" FOREIGN KEY ("ambilBarangId") REFERENCES "AmbilBarang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailSetor" ADD CONSTRAINT "DetailSetor_stokHarianId_fkey" FOREIGN KEY ("stokHarianId") REFERENCES "StokHarian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailKeuangan" ADD CONSTRAINT "DetailKeuangan_detailSetorId_fkey" FOREIGN KEY ("detailSetorId") REFERENCES "DetailSetor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
