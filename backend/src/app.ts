import express from 'express';
import cors from 'cors';
import path from 'path';
import v1_router from 'routes/v1_router';

const app = express();

app.use(cors());

app.use(express.json());

// API routes
app.use('/api/v1', v1_router);

// API health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Sweet Management System API is running!', status: 'healthy' });
});

// Serve static files from Next.js build
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../.next/static')));

// Handle Next.js pages
app.get('*', (req, res) => {
  // Don't serve frontend for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

export default app;
