import { loginUser } from 'controller/v1/auth/loginUser';
import { registerUser } from 'controller/v1/auth/registerUser';
import { verifyJWT } from 'controller/v1/auth/verifyJWT';
import { Router } from 'express';

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.get('/verify', verifyJWT);

export default authRouter;
