import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  var prisma: PrismaClient | undefined;
}

// In development, we attach the client to the `global` object to reuse the instance.
if (process.env.MODE === 'development') {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
} else {
  prisma = new PrismaClient();
}

export default prisma;
