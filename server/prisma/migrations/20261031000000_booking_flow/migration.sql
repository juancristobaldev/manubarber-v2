ALTER TABLE "Booking" ADD COLUMN "endsAt" TIMESTAMP(3), ADD COLUMN "holdExpiresAt" TIMESTAMP(3), ADD COLUMN "depositAmount" INTEGER, ADD COLUMN "flowToken" TEXT, ADD COLUMN "paymentStatus" TEXT, ADD COLUMN "flowOrder" TEXT;
CREATE UNIQUE INDEX "Booking_flowToken_key" ON "Booking"("flowToken");
