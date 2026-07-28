import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { ENV } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import routes from './src/routes/index.js';
import { errorHandler } from './src/middleware/error.middleware.js';

const app = express();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve('public/uploads')));

app.use(
  cors({
    origin: [ENV.CLIENT_URL_WEB, ENV.CLIENT_URL_ADMIN, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

// Database Connection
connectDB();

// API Routes
app.use('/api', routes);

// Base route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Maaza Printwala Backend API [Production v1.0.0]',
    version: '1.0.0',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = ENV.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${ENV.NODE_ENV} mode on port ${PORT}`);
});

export default app;
