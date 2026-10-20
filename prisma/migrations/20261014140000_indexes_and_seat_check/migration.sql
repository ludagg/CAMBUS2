-- Hot-path indexes
CREATE INDEX "Passenger_bookingId_idx" ON "Passenger"("bookingId");
CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");
CREATE INDEX "Departure_vehicleId_idx" ON "Departure"("vehicleId");
CREATE INDEX "Departure_originStationId_idx" ON "Departure"("originStationId");
CREATE INDEX "Departure_destStationId_idx" ON "Departure"("destStationId");

-- Never allow negative availability for new writes (NOT VALID: legacy rows are not re-checked).
ALTER TABLE "Departure" ADD CONSTRAINT "Departure_seatsAvailable_nonneg" CHECK ("seatsAvailable" >= 0) NOT VALID;
