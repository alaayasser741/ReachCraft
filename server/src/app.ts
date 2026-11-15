import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';

import authRoutes from './routes/auth.routes.js';
import filesRoutes from './routes/files.routes.js';
import companiesRoutes from './routes/companies.routes.js';
import contactsRoutes from './routes/contacts.routes.js';
import templatesRoutes from './routes/templates.routes.js';
import campaignsRoutes from './routes/campaigns.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import logsRoutes from './routes/logs.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import aiRoutes from './routes/ai.routes.js';
import inboxRoutes from './routes/inbox.routes.js';
import unsubscribeRoutes from './routes/unsubscribe.routes.js';
import adminRoutes from './routes/admin.routes.js';

export function createApp(): express.Application {
  const app = express();

  // Basic security and parsing with Google Identity Services (GIS) compatibility
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows inline scripts for dev & preview
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Critical for Google Sign-In popup postMessage
      crossOriginResourcePolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // Required for Google OAuth origin verification
    })
  );

  app.use(
    cors({
      origin: [
        env.CLIENT_URL,
        'https://reachcraft.fly.dev',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/files', filesRoutes);
  app.use('/api/companies', companiesRoutes);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/templates', templatesRoutes);
  app.use('/api/campaigns', campaignsRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/logs', logsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/inbox', inboxRoutes);
  app.use('/api/admin', adminRoutes);

  // Public Unsubscribe Endpoint
  app.use('/unsubscribe', unsubscribeRoutes);

  // Serve Client SPA in production/standalone mode if dist exists
  const candidateDistPaths = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'dist/client'),
    path.resolve(process.cwd(), 'public'),
  ];
  const clientDistPath = candidateDistPaths.find((p) => fs.existsSync(p));

  if (clientDistPath) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/unsubscribe')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // Central error handler
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('Unhandled server error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error',
      });
    }
  );

  return app;
}
