import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import { connectDB } from './src/config/db.js';
import routes from './src/routes/index.js';
import { errorHandler } from './src/middleware/error.middleware.js';

const app = express();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
import { authenticate } from './src/middleware/auth.middleware.js';

app.use('/uploads/artwork', authenticate, express.static(path.resolve('public/uploads/artwork')));
app.use('/uploads', express.static(path.resolve('public/uploads')));
app.use('/images', express.static(path.resolve('public/images')));

const allow = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: (o, cb) => cb(null, !o || allow.includes(o)),
    credentials: true,
  })
);

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
