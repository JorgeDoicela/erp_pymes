-- CreateTable
CREATE TABLE "ent_projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "industry" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'IDEATION',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "valuation" DOUBLE PRECISION DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "equityAvailable" DOUBLE PRECISION DEFAULT 100,
    "logoUrl" TEXT,
    "videoPitchUrl" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ent_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ent_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT,
    "externalName" TEXT,
    "externalEmail" TEXT,
    "role" TEXT NOT NULL,

    CONSTRAINT "ent_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ent_mentors" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT,
    "mentorName" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "ent_mentors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ent_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ent_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ent_documents" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "ent_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ent_updates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ent_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ent_members_projectId_idx" ON "ent_members"("projectId");

-- CreateIndex
CREATE INDEX "ent_members_employeeId_idx" ON "ent_members"("employeeId");

-- CreateIndex
CREATE INDEX "ent_mentors_projectId_idx" ON "ent_mentors"("projectId");

-- CreateIndex
CREATE INDEX "ent_milestones_projectId_idx" ON "ent_milestones"("projectId");

-- CreateIndex
CREATE INDEX "ent_documents_projectId_idx" ON "ent_documents"("projectId");

-- CreateIndex
CREATE INDEX "ent_updates_projectId_idx" ON "ent_updates"("projectId");

-- AddForeignKey
ALTER TABLE "ent_projects" ADD CONSTRAINT "ent_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_members" ADD CONSTRAINT "ent_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ent_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_members" ADD CONSTRAINT "ent_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_mentors" ADD CONSTRAINT "ent_mentors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ent_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_mentors" ADD CONSTRAINT "ent_mentors_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_milestones" ADD CONSTRAINT "ent_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ent_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_documents" ADD CONSTRAINT "ent_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ent_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_updates" ADD CONSTRAINT "ent_updates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ent_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
