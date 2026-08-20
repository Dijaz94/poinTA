-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable (Session.dayOfWeek TEXT -> DayOfWeek enum)
ALTER TABLE "Session" DROP COLUMN "dayOfWeek";
ALTER TABLE "Session" ADD COLUMN "dayOfWeek" "DayOfWeek";

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_subjectId_fkey";
ALTER TABLE "Material" DROP CONSTRAINT "Material_subjectId_fkey";
ALTER TABLE "Session" DROP CONSTRAINT "Session_subjectId_fkey";

-- AddForeignKey (ON DELETE CASCADE)
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Material" ADD CONSTRAINT "Material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;