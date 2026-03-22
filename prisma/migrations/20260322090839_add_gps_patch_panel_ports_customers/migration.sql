-- CreateTable
CREATE TABLE "PatchPanelPort" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "portNumber" INTEGER NOT NULL,
    "label" TEXT,
    "connectedTo" TEXT,
    "cableType" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatchPanelPort_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "customerId" TEXT,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Device_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Device_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Device" ("createdAt", "id", "ipAddress", "location", "macAddress", "manufacturer", "model", "name", "notes", "parentId", "serialNumber", "status", "type", "updatedAt") SELECT "createdAt", "id", "ipAddress", "location", "macAddress", "manufacturer", "model", "name", "notes", "parentId", "serialNumber", "status", "type", "updatedAt" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
CREATE INDEX "Device_type_idx" ON "Device"("type");
CREATE INDEX "Device_status_idx" ON "Device"("status");
CREATE INDEX "Device_location_idx" ON "Device"("location");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PatchPanelPort_deviceId_idx" ON "PatchPanelPort"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "PatchPanelPort_deviceId_portNumber_key" ON "PatchPanelPort"("deviceId", "portNumber");
