import { PrismaClient } from "@prisma/client";
// AI explanations to help: Basically this file makes sure previous db connections are closed

// 1. "global" is a special Javascript bucket that exists outside of Next.js's reloading logic.
// It survives the "refresh".
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  // 2. CHECK: Is there already a client in the bucket?
  globalForPrisma.prisma ||
  // 3. CREATE: If not (or if it's the first time), create a new one.
  new PrismaClient();

// 4. SAVE: If we are in "dev" mode, put this new client into the bucket
// so we can find it next time the file reloads.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
