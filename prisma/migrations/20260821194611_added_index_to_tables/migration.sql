-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "unitId" TEXT;

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Unit_id_idx" ON "Unit"("id");

-- CreateIndex
CREATE INDEX "Announcement_id_idx" ON "Announcement"("id");

-- CreateIndex
CREATE INDEX "Material_id_idx" ON "Material"("id");

-- CreateIndex
CREATE INDEX "PollOption_id_idx" ON "PollOption"("id");

-- CreateIndex
CREATE INDEX "Session_id_idx" ON "Session"("id");

-- CreateIndex
CREATE INDEX "Subject_id_idx" ON "Subject"("id");

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User"("id");

-- CreateIndex
CREATE INDEX "Vote_id_idx" ON "Vote"("id");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
