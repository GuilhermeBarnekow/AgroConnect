const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateRequest');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  validate(schemas.register),
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  validate(schemas.login),
  authController.login
);

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/profile',
  authenticate,
  validate(schemas.updateProfile),
  authController.updateProfile
);

/**
 * @route PUT /api/auth/password
 * @desc Change password
 * @access Private
 */
router.put(
  '/password',
  authenticate,
  validate({
    currentPassword: {
      in: ['body'],
      isString: true,
      notEmpty: {
        errorMessage: 'Senha atual é obrigatória',
      },
    },
    newPassword: {
      in: ['body'],
      isString: true,
      notEmpty: {
        errorMessage: 'Nova senha é obrigatória',
      },
      isLength: {
        options: { min: 6 },
        errorMessage: 'Nova senha deve ter pelo menos 6 caracteres',
      },
    },
  }),
  authController.changePassword
);

/**
 * @route DELETE /api/auth/account
 * @desc Delete account
 * @access Private
 */
router.delete(
  '/account',
  authenticate,
  authController.deleteAccount
);

module.exports = router;
