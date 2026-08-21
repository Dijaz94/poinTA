-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('COMMUNICATION', 'POLL');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "authorizedEmails" TEXT[],
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "type" "AnnouncementType" NOT NULL DEFAULT 'COMMUNICATION',
ALTER COLUMN "content" SET DEFAULT '';

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vote_email_optionId_key" ON "Vote"("email", "optionId");

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
