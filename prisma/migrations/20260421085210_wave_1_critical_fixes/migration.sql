/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `BookingGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BookingGroup" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "notifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BookingSeat" (
    "id" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingSeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingSeat_bookingId_idx" ON "BookingSeat"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSeat_departureId_seatId_key" ON "BookingSeat"("departureId", "seatId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingGroup_idempotencyKey_key" ON "BookingGroup"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BookingGroup_status_expiresAt_idx" ON "BookingGroup"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "BookingSeat" ADD CONSTRAINT "BookingSeat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
