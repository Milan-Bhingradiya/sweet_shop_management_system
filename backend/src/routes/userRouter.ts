import { Router } from 'express';
import { listCategories } from 'controller/v1/category/listCategory';
import { getCategoryById } from 'controller/v1/category/getCategoryById';
import { listProducts } from 'controller/v1/product/listProducts';
import { getProductDetails } from 'controller/v1/product/getProductDetails';
import { createOrder } from 'controller/v1/order/createOrder';
import { listOrders } from 'controller/v1/order/listOrders';
import { getOrderById } from 'controller/v1/order/getOrderById';
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
userRouter.get('/orders', authenticateToken, listOrders);
userRouter.get('/orders/:id', authenticateToken, getOrderById);

export default userRouter;
