-- CreateEnum
CREATE TYPE "DepartureStatus" AS ENUM ('SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "BookingGroup" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "soldByUserId" TEXT;

-- AlterTable
ALTER TABLE "Departure" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "delayMinutes" INTEGER,
ADD COLUMN     "passengersNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "tripStatus" "DepartureStatus" NOT NULL DEFAULT 'SCHEDULED';

-- CreateIndex
CREATE INDEX "BookingGroup_soldByUserId_idx" ON "BookingGroup"("soldByUserId");

-- AddForeignKey
ALTER TABLE "BookingGroup" ADD CONSTRAINT "BookingGroup_soldByUserId_fkey" FOREIGN KEY ("soldByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
