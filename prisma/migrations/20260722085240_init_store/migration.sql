-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nepal',
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "deliveryRadiusKm" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "status" "StoreStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_ownerUserId_idx" ON "stores"("ownerUserId");

-- CreateIndex
CREATE INDEX "stores_latitude_longitude_idx" ON "stores"("latitude", "longitude");
