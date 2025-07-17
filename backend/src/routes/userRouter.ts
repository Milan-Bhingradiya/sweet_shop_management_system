import { Router } from 'express';
import { listCategories } from 'controller/v1/category/listCategory';
import { getCategoryById } from 'controller/v1/category/getCategoryById';
import { listProducts } from 'controller/v1/product/listProducts';
import { getProductDetails } from 'controller/v1/product/getProductDetails';

const userRouter = Router();

// Public category routes (no authentication required)
userRouter.get('/listCategories', listCategories);
userRouter.get('/categories/:id', getCategoryById);

// === PRODUCT ROUTES (accessible by both users and admins) ===
userRouter.get('/products', listProducts);
userRouter.get('/products/:id', getProductDetails);

export default userRouter;
