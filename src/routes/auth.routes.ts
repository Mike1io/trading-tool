import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateRequest(RegisterSchema),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest(LoginSchema),
  AuthController.login
);

router.post(
  '/refresh',
  validateRequest(RefreshTokenSchema),
  AuthController.refreshToken
);

router.post(
  '/logout',
  authenticateJWT,
  validateRequest(RefreshTokenSchema),
  AuthController.logout
);

router.get('/me', authenticateJWT, AuthController.getMe);

export const authRouter = router;
