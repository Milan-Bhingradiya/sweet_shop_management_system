import { addCategory } from 'controller/v1/category/addCategory';
import { Router } from 'express';
import { authenticateToken, requireAdmin } from 'middleware/jwtUtility';
import { deleteCategory } from 'controller/v1/category/deleteCategory';
import { editCategory } from 'controller/v1/category/editCategory';
import { addProduct } from 'controller/v1/product/addProduct';
import { updateProduct } from 'controller/v1/product/updateProduct';
import { deleteProduct } from 'controller/v1/product/deleteProduct';

const adminRouter = Router();

// Apply authentication and admin role requirement to all admin routes
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

// === CATEGORY ROUTES ===
adminRouter.post('/categories', addCategory);
adminRouter.delete('/categories/:id', deleteCategory);
adminRouter.put('/categories/:id', editCategory);

// === PRODUCT ROUTES ===
adminRouter.post('/products', addProduct);
adminRouter.put('/products/:id', updateProduct);
adminRouter.delete('/products/:id', deleteProduct); // ← MAKE SURE THIS EXISTS

export default adminRouter;
