-- DropForeignKey
ALTER TABLE "AmbilBarang" DROP CONSTRAINT "AmbilBarang_setorKepadaId_fkey";

-- AlterTable
ALTER TABLE "AmbilBarang" ALTER COLUMN "setorKepadaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AmbilBarang" ADD CONSTRAINT "AmbilBarang_setorKepadaId_fkey" FOREIGN KEY ("setorKepadaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
