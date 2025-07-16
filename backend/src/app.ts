import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Sweet Management System API!' });
});

export default app;
