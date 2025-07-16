import { Router } from 'express';
import authRouter from './authRouter';
import adminRouter from './adminRouter';

const v1_router = Router();

v1_router.use('/auth', authRouter);
v1_router.use('/admin', adminRouter);

export default v1_router;
