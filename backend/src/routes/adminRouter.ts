import { addCategory } from 'controller/v1/category/addCategory';
import { Router } from 'express';
import { authenticateToken, requireAdmin } from '@utils/jwtUtility';

const adminRouter = Router();

// Apply authentication and admin role requirement to all admin routes
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

// Category routes
adminRouter.post('/categories', addCategory);

export default adminRouter;
