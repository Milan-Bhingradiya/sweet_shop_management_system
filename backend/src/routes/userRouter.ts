import { Router } from 'express';
import { listCategories } from 'controller/v1/category/listCategory';

const userRouter = Router();

// Public category routes (no authentication required)
userRouter.get('/listCategories', listCategories);

export default userRouter;
