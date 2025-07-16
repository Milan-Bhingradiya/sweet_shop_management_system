import { Router } from 'express';
import authRouter from './authRouter';

const v1_router = Router();

v1_router.use('/auth', authRouter);
v1_router.use('/protected', protectedRoutes);

export default v1_router;
