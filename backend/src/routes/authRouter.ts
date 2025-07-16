import { loginUser } from 'controller/v1/auth/loginUser';
import { registerUser } from 'controller/v1/auth/registerUser';
import { Router } from 'express';

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);

export default authRouter;
