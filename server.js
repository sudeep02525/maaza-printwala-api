import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import { connectDB } from './src/config/db.js';
import routes from './src/routes/index.js';
import { errorHandler } from './src/middleware/error.middleware.js';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import { authenticate } from './src/middleware/auth.middleware.js';

const app = express();

const allow = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: (o, cb) => cb(null, !o || allow.includes(o)),
    credentials: true,
  })
);

// Hardening Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
}));
app.use((req, res, next) => {
  // Express 5 makes req.query a getter-only property on the prototype.
  // We shadow it on the instance to allow express-mongo-sanitize to mutate it.
  const originalQuery = req.query;
  Object.defineProperty(req, 'query', {
    value: originalQuery,
    writable: true,
    configurable: true
  });
  next();
});
app.use(mongoSanitize());
app.use(compression());

// Middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads/artwork', authenticate, express.static(path.resolve('public/uploads/artwork')));
app.use('/uploads', express.static(path.resolve('public/uploads')));
app.use('/images', express.static(path.resolve('public/images')));

import { initSearchEngine } from './src/services/search.service.js';

// Database Connection
connectDB().then(() => {
  initSearchEngine();
});

// API Routes
app.use('/api', routes);

// Base route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Maza Printwala Backend API [Production v1.0.0]',
    version: '1.0.0',
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
