import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../validations/auth.validation';

const router = Router();

/**
 * Public Auth Routes
 */
router.post(
  '/register',
  validate({ body: registerSchema }),
  (req, res, next) => authController.register(req, res, next)
);

router.post(
  '/login',
  validate({ body: loginSchema }),
  (req, res, next) => authController.login(req, res, next)
);

router.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  (req, res, next) => authController.refresh(req, res, next)
);

/**
 * Protected Auth Routes (Require Valid Token)
 */
router.post(
  '/logout',
  (req, res, next) => authController.logout(req, res, next)
);

router.get(
  '/me',
  authenticate,
  (req, res, next) => authController.getMe(req, res, next)
);

router.patch(
  '/profile',
  authenticate,
  validate({ body: updateProfileSchema }),
  (req, res, next) => authController.updateProfile(req, res, next)
);

router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  (req, res, next) => authController.changePassword(req, res, next)
);

export default router;
