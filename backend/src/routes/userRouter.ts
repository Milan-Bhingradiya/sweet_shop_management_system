import { Router } from 'express';
import { listCategories } from 'controller/v1/category/listCategory';
import { getCategoryById } from 'controller/v1/category/getCategoryById';

const userRouter = Router();

// Public category routes (no authentication required)
userRouter.get('/listCategories', listCategories);
userRouter.get('/categories/:id', getCategoryById);

export default userRouter;
