const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');

const { body } = require('express-validator');

router.use(authMiddleware.authenticate);

// Validação para envio de documento
const validateDocumentSubmission = [
  body('type')
    .isIn(['cpf', 'cnpj', 'rg', 'crea', 'diploma', 'certificado', 'outro'])
    .withMessage('Tipo de documento inválido'),
  body('documentUrl')
    .isURL()
    .withMessage('URL do documento inválida'),
  body('documentNumber')
    .optional()
    .isString()
    .withMessage('Número do documento inválido'),
];

// Validação para verificação de documento
const validateDocumentVerification = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status inválido'),
  body('rejectionReason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('Motivo da rejeição é obrigatório quando o status é "rejected"'),
];

// Rotas
router.post(
  '/',
  validateDocumentSubmission,
  documentController.submitDocument
);


router.get('/', documentController.getUserDocuments);

router.get('/:id', documentController.getDocumentById);

router.put(
  '/:id/verify',
  validateDocumentVerification,
  documentController.verifyDocument
);


router.delete('/:id', documentController.deleteDocument);

module.exports = router;
