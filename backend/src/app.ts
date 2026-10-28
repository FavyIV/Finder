import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';

import { authRouter } from './routes/auth.routes';
import { locationsRouter } from './routes/locations.routes';
import { foundListingsRouter } from './routes/found-listings.routes';

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

  // Feature routes:
  // Step 3 → Auth routes
  app.use('/api/v1/auth', authRouter);

  // Step 4 → Locations & Found listings create
  app.use('/api/v1/locations', locationsRouter);
  app.use('/api/v1/found-listings', foundListingsRouter);

  // Error handler must be the last middleware
  app.use(errorHandler);

  return app;
}
