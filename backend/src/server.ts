import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function main(): Promise<void> {
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[server] Running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err: unknown) => {
  console.error('[server] Failed to start:', err);
  void prisma.$disconnect();
  process.exit(1);
});
