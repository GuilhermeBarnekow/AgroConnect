const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateRequest');

/**
 * @route POST /api/offers
 * @desc Create offer
 * @access Private
 */
router.post(
  '/',
  authenticate,
  validate(schemas.createOffer),
  offerController.createOffer
);

/**
 * @route GET /api/offers/:id
 * @desc Get offer by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  offerController.getOfferById
);

/**
 * @route PUT /api/offers/:id/status
 * @desc Update offer status
 * @access Private
 */
router.put(
  '/:id/status',
  authenticate,
  validate(schemas.updateOfferStatus),
  offerController.updateOfferStatus
);

/**
 * @route GET /api/offers/user
 * @desc Get user offers
 * @access Private
 */
router.get(
  '/user/me',
  authenticate,
  validate(schemas.pagination),
  offerController.getUserOffers
);

/**
 * @route GET /api/offers/received
 * @desc Get received offers
 * @access Private
 */
router.get(
  '/user/received',
  authenticate,
  validate(schemas.pagination),
  offerController.getReceivedOffers
);

/**
 * @route PUT /api/offers/:id/counteroffer
 * @desc Counter offer
 * @access Private
 */
router.put(
  '/:id/counteroffer',
  authenticate,
  offerController.counterOffer
);


/**
 * @route GET /api/offers/announcement/:id
 * @desc Get announcement offers
 * @access Private
 */
router.get(
  '/announcement/:id',
  authenticate,
  validate(schemas.pagination),
  offerController.getAnnouncementOffers
);

module.exports = router;
