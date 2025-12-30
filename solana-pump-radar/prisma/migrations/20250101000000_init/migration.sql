-- CreateTable
CREATE TABLE "LaunchEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "blockTime" DATETIME NOT NULL,
    "mint" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'pumpfun',
    "rawJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TokenRiskReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mint" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "reasonsJson" TEXT NOT NULL,
    "authoritiesJson" TEXT NOT NULL,
    "topHoldersJson" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LaunchEvent_signature_key" ON "LaunchEvent"("signature");

-- CreateIndex
CREATE INDEX "LaunchEvent_mint_idx" ON "LaunchEvent"("mint");

-- CreateIndex
CREATE INDEX "LaunchEvent_blockTime_idx" ON "LaunchEvent"("blockTime");

-- CreateIndex
CREATE UNIQUE INDEX "TokenRiskReport_mint_key" ON "TokenRiskReport"("mint");

-- CreateIndex
CREATE INDEX "TokenRiskReport_label_idx" ON "TokenRiskReport"("label");

-- CreateIndex
CREATE INDEX "TokenRiskReport_computedAt_idx" ON "TokenRiskReport"("computedAt");