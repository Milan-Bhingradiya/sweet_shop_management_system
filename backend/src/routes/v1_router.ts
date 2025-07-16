import { Router } from 'express';
import authRouter from './authRouter';
import adminRouter from './adminRouter';
import userRouter from './userRouter';

const v1_router = Router();

v1_router.use('/auth', authRouter);
v1_router.use('/admin', adminRouter);
v1_router.use('/user', userRouter);

export default v1_router;
