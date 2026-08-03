import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { UpdateProfileSchema, UpdateUserRoleSchema, ListUsersQuerySchema } from '../schemas/user.schema.js';
import { Role } from '@prisma/client';

const router = Router();

// Protect all user routes with JWT
router.use(authenticateJWT);

router.get('/profile', UserController.getProfile);
router.patch('/profile', validateRequest(UpdateProfileSchema), UserController.updateProfile);

// Admin-only endpoints
router.get(
  '/',
  authorizeRoles(Role.ADMIN),
  validateRequest(ListUsersQuerySchema),
  UserController.listUsers
);

router.patch(
  '/:id/role',
  authorizeRoles(Role.ADMIN),
  validateRequest(UpdateUserRoleSchema),
  UserController.updateUserRole
);

router.delete(
  '/:id',
  authorizeRoles(Role.ADMIN),
  UserController.deleteUser
);

export const userRouter = router;
