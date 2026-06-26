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

// Ensure local uploads folders exist for fallback mock mode
const localUploadsDir = path.join(__dirname, 'uploads', 'tenders');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  next();
});

// Serve mock uploads if any
app.use('/mock-uploads', express.static(path.join(__dirname, 'uploads')));

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

// Connect to Supabase & Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Supabase and seed default users if needed
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
