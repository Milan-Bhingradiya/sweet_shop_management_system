import { registerUser } from 'controller/v1/auth/registerUser';
import { Router } from 'express';

const authRouter = Router();

authRouter.post('/register', registerUser);

export default authRouter;
