const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateRequest');
const { body, validationResult } = require('express-validator');

// Validação para atualização de perfil
const validateProfileUpdate = [
  body('bio')
    .optional()
    .isString()
    .withMessage('Biografia deve ser um texto'),
  body('specialties')
    .optional()
    .isArray()
    .withMessage('Especialidades deve ser um array'),
  body('specialties.*')
    .optional()
    .isString()
    .withMessage('Cada especialidade deve ser um texto'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website deve ser uma URL válida'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Rotas públicas
router.get('/:id', userController.getUserProfile);
router.get('/:id/stats', userController.getUserStats);

// Rotas que requerem autenticação
router.use(authMiddleware.authenticate);

router.put(
  '/profile',
  validateProfileUpdate,
  userController.updateUserProfile
);

module.exports = router;
