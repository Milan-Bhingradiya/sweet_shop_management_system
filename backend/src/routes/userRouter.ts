import { Router } from 'express';
import { listCategories } from 'controller/v1/category/listCategory';
import { getCategoryById } from 'controller/v1/category/getCategoryById';
import { listProducts } from 'controller/v1/product/listProducts';
import { getProductDetails } from 'controller/v1/product/getProductDetails';
import { createOrder } from 'controller/v1/order/createOrder';
import { authenticateToken } from 'middleware/jwtUtility';

const userRouter = Router();

// Public category routes (no authentication required)
userRouter.get('/listCategories', listCategories);
userRouter.get('/categories/:id', getCategoryById);

// === PRODUCT ROUTES (accessible by both users and admins) ===
userRouter.get('/products', listProducts);
userRouter.get('/products/:id', getProductDetails);

// === ORDER ROUTES (authentication required) ===
userRouter.post('/orders', authenticateToken, createOrder);

export default userRouter;
