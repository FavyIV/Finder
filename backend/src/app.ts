import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';

/**
 * Builds and returns the configured Express application.
 * Routes are registered per feature unit — see ai-workflow-rules.md build order.
 */
export function createApp(): express.Application {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — only the configured frontend origin is allowed
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );

  // JSON body parser (multipart handled per-route via multer)
  app.use(express.json());

  // Health check — useful for deployment liveness probes
  app.get('/api/v1/health', (_req, res) => {
    res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  // Feature routes registered here as each unit is built:
  // Step 3  → auth routes
  // Step 4  → found-listing create
  // Step 5  → found-listing search & detail
  // Step 6  → found-listing edit
  // Step 7  → claim action
  // Step 8  → report listing
  // Step 9  → admin moderation queue
  // Step 10 → lost listings

  // Error handler must be the last middleware
  app.use(errorHandler);

  return app;
}
