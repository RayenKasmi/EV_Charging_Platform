/*
  Warnings:

  - The values [OUT_OF_SERVICE] on the enum `ChargerStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[chargerId]` on the table `Charger` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chargerId` to the `Charger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `connectorType` to the `Charger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Charger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operatorId` to the `Station` table without a default value. This is not possible if the table is not empty.

*/

-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ChargerType" AS ENUM ('LEVEL_2', 'DC_FAST');

-- CreateEnum
CREATE TYPE "ConnectorType" AS ENUM ('CCS', 'CHADEMO', 'TYPE_2', 'J1772');

-- AlterEnum
BEGIN;
CREATE TYPE "ChargerStatus_new" AS ENUM ('AVAILABLE', 'OCCUPIED', 'OFFLINE', 'MAINTENANCE');
ALTER TABLE "public"."Charger" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Charger" ALTER COLUMN "status" TYPE "ChargerStatus_new" USING ("status"::text::"ChargerStatus_new");
ALTER TYPE "ChargerStatus" RENAME TO "ChargerStatus_old";
ALTER TYPE "ChargerStatus_new" RENAME TO "ChargerStatus";
DROP TYPE "public"."ChargerStatus_old";
ALTER TABLE "Charger" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- AlterTable
ALTER TABLE "Charger" ADD COLUMN     "chargerId" TEXT NOT NULL,
ADD COLUMN     "connectorType" "ConnectorType" NOT NULL,
ADD COLUMN     "currentRate" DOUBLE PRECISION,
ADD COLUMN     "type" "ChargerType" NOT NULL;

-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "location" geography(Point, 4326),
ADD COLUMN     "operatorId" TEXT NOT NULL,
ADD COLUMN     "status" "StationStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "Charger_chargerId_key" ON "Charger"("chargerId");

-- CreateIndex
CREATE INDEX "Charger_chargerId_idx" ON "Charger"("chargerId");

-- CreateIndex
CREATE INDEX "Station_status_idx" ON "Station"("status");

-- CreateIndex
CREATE INDEX "Station_operatorId_idx" ON "Station"("operatorId");

-- CreateIndex
CREATE INDEX "Station_location_idx" ON "Station" USING GIST ("location");

-- AddForeignKey
ALTER TABLE "Station" ADD CONSTRAINT "Station_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trigger function to auto update location based on latitude and longitude
CREATE OR REPLACE FUNCTION update_station_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update location if latitude or longitude has changed
  IF (TG_OP = 'INSERT') OR 
     (NEW.latitude IS DISTINCT FROM OLD.latitude) OR 
     (NEW.longitude IS DISTINCT FROM OLD.longitude) THEN
    
    -- Create geography point from lat/lng
    -- Note: ST_MakePoint takes (longitude, latitude) - order matters!
    NEW.location = ST_SetSRID(
      ST_MakePoint(NEW.longitude, NEW.latitude), 
      4326
    )::geography;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger before insert or update
CREATE TRIGGER station_location_trigger
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON "Station"
  FOR EACH ROW
  EXECUTE FUNCTION update_station_location();

-- Backfill existing records with location data
UPDATE "Station" 
SET location = ST_SetSRID(
  ST_MakePoint(longitude, latitude), 
  4326
)::geography
WHERE location IS NULL;