const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateRequest');

/**
 * @route POST /api/reviews
 * @desc Create review
 * @access Private
 */
router.post(
  '/',
  authenticate,
  validate(schemas.createReview),
  reviewController.createReview
);

/**
 * @route GET /api/reviews/check/:offerId
 * @desc Check if user can review an offer
 * @access Private
 */
router.get(
  '/check/:offerId',
  authenticate,
  reviewController.checkCanReview
);

/**
 * @route GET /api/reviews/given
 * @desc Get reviews given by user
 * @access Private
 */
router.get(
  '/given',
  authenticate,
  validate(schemas.pagination),
  reviewController.getGivenReviews
);

/**
 * @route GET /api/reviews/received
 * @desc Get reviews received by user
 * @access Private
 */
router.get(
  '/received',
  authenticate,
  validate(schemas.pagination),
  reviewController.getReceivedReviews
);

/**
 * @route GET /api/reviews/user/:id
 * @desc Get user reviews
 * @access Public
 */
router.get(
  '/user/:id',
  validate(schemas.pagination),
  reviewController.getUserReviews
);

module.exports = router;
