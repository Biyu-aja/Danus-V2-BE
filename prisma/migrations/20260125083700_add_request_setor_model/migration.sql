-- CreateTable
CREATE TABLE "RequestSetor" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestSetor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailRequestSetor" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "detailSetorId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "DetailRequestSetor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RequestSetor" ADD CONSTRAINT "RequestSetor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestSetor" ADD CONSTRAINT "RequestSetor_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailRequestSetor" ADD CONSTRAINT "DetailRequestSetor_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RequestSetor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailRequestSetor" ADD CONSTRAINT "DetailRequestSetor_detailSetorId_fkey" FOREIGN KEY ("detailSetorId") REFERENCES "DetailSetor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
