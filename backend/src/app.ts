import express from 'express';
import cors from 'cors';
import v1_router from 'routes/v1_router';

const app = express();

app.use(cors());

app.use(express.json());

app.use('/v1', v1_router);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Sweet Management System API!' });
});

export default app;
