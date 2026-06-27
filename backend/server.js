import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import checklistRoutes from './routes/checklists.js';
import analyticsRoutes from './routes/analytics.js';
import exportRoutes from './routes/export.js';
import themeRoutes from './routes/theme.js';
import documentRoutes from './routes/documents.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();

// Set up directory variables for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local uploads folders exist (local dev only — Vercel is read-only)
if (process.env.NODE_ENV !== 'production') {
  const localUploadsDir = path.join(__dirname, 'uploads', 'tenders');
  if (!fs.existsSync(localUploadsDir)) {
    fs.mkdirSync(localUploadsDir, { recursive: true });
  }
}

// CORS — allow frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,           // Set this in Vercel env vars
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain or localhost
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  next();
});

// Serve mock uploads if any (local dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/mock-uploads', express.static(path.join(__dirname, 'uploads')));
}

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/documents', documentRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'AI Tender Preparation Checklist Generator API - Running (Supabase)' });
});

// Initialize Supabase connection + seed users
connectDB();

// Local dev: start the server normally
// Production (Vercel): export app as a serverless function
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
  });
}

export default app;
