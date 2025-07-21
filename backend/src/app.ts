import express from 'express';
import cors from 'cors';
import path from 'path';
import v1_router from 'routes/v1_router';

const app = express();

app.use(cors());

app.use(express.json());

// API routes
app.use('/v1', v1_router);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Sweet Management System API!' });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Sweet Management System API is running!', status: 'healthy' });
});

export default app;
