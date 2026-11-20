-- CreateTable
CREATE TABLE "ChaosFlag" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaosFlag_pkey" PRIMARY KEY ("id")
);

