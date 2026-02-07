-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('RUN', 'REST', 'CROSS_TRAIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('SCHEDULED', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('TARGET_2K', 'TARGET_5K', 'TARGET_10K', 'TARGET_MARATHON', 'STAY_ACTIVE');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "nickName" TEXT,
    "age" INTEGER,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "experienceLevel" TEXT,
    "goal" "Goal" NOT NULL,
    "daysAvailable" TEXT[],
    "injuryHistory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "targetDistanceKm" DOUBLE PRECISION,
    "targetDurationMin" INTEGER,
    "targetRpe" INTEGER,
    "description" TEXT,
    "aiReasoning" TEXT,
    "status" "Status" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "training_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "actualDistanceKm" DOUBLE PRECISION,
    "actualDurationMin" INTEGER,
    "actualRpe" INTEGER,
    "painReported" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" TEXT,
    "payload" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "training_plan" ADD CONSTRAINT "training_plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_logs" ADD CONSTRAINT "run_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_logs" ADD CONSTRAINT "run_logs_planId_fkey" FOREIGN KEY ("planId") REFERENCES "training_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
