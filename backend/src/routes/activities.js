const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware para autenticação
router.use(authMiddleware.authenticate);


// Rotas
router.get('/', activityController.getUserActivities);
router.get('/user/:id', activityController.getUserPublicActivities);

module.exports = router;
