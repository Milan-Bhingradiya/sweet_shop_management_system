import { Router } from 'express';
import authRouter from './authRouter';

const v1_router = Router();

v1_router.use('/auth', authRouter);

export default v1_router;
