-- CreateTable
CREATE TABLE "Firm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shareWithFirm" BOOLEAN NOT NULL DEFAULT false,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrmConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "syncedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "crmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "emailDomain" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "crmId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "direction" TEXT
);

-- CreateTable
CREATE TABLE "HiddenContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PortfolioCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "pitch" TEXT NOT NULL,
    "dealroomId" TEXT,
    "matchMethod" TEXT,
    "matchStatus" TEXT NOT NULL DEFAULT 'unconfirmed',
    "sectors" JSONB NOT NULL,
    "nextRound" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "EntityMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "dealroomInvestorId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unconfirmed'
);

-- CreateTable
CREATE TABLE "DealroomCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "json" JSONB NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Firm_firmId_key" ON "Firm"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_firmId_idx" ON "User"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmConnection_firmId_userId_provider_key" ON "CrmConnection"("firmId", "userId", "provider");

-- CreateIndex
CREATE INDEX "Contact_firmId_idx" ON "Contact"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_firmId_ownerUserId_crmId_key" ON "Contact"("firmId", "ownerUserId", "crmId");

-- CreateIndex
CREATE INDEX "Interaction_firmId_contactId_userId_idx" ON "Interaction"("firmId", "contactId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Interaction_firmId_userId_crmId_contactId_key" ON "Interaction"("firmId", "userId", "crmId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenContact_firmId_userId_contactId_key" ON "HiddenContact"("firmId", "userId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioCompany_firmId_domain_key" ON "PortfolioCompany"("firmId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "EntityMatch_firmId_contactId_dealroomInvestorId_key" ON "EntityMatch"("firmId", "contactId", "dealroomInvestorId");

-- CreateIndex
CREATE UNIQUE INDEX "DealroomCache_firmId_kind_key_key" ON "DealroomCache"("firmId", "kind", "key");

