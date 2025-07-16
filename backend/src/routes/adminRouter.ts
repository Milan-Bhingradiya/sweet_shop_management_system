import { addCategory } from 'controller/v1/category/addCategory';
import { Router } from 'express';
import { authenticateToken, requireAdmin } from '@utils/jwtUtility';
import { deleteCategory } from 'controller/v1/category/deleteCategory';

const adminRouter = Router();

// Apply authentication and admin role requirement to all admin routes
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

// Category routes
adminRouter.post('/categories', addCategory);
adminRouter.delete('/categories/:id', deleteCategory);

export default adminRouter;
