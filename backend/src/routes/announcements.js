const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate, isOwner } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateRequest');

/**
 * @route GET /api/announcements
 * @desc Get all announcements
 * @access Public
 */
router.get(
  '/',
  validate(schemas.pagination),
  announcementController.getAnnouncements
);

/**
 * @route GET /api/announcements/:id
 * @desc Get announcement by ID
 * @access Public
 */
router.get(
  '/:id',
  announcementController.getAnnouncementById
);

/**
 * @route POST /api/announcements
 * @desc Create announcement
 * @access Private
 */
router.post(
  '/',
  authenticate,
  validate(schemas.createAnnouncement),
  announcementController.createAnnouncement
);

/**
 * @route PUT /api/announcements/:id
 * @desc Update announcement
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  validate(schemas.updateAnnouncement),
  announcementController.updateAnnouncement
);

/**
 * @route DELETE /api/announcements/:id
 * @desc Delete announcement
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  announcementController.deleteAnnouncement
);

/**
 * @route GET /api/announcements/user/me
 * @desc Get user announcements
 * @access Private
 */
router.get(
  '/user/me',
  authenticate,
  validate(schemas.pagination),
  announcementController.getUserAnnouncements
);

module.exports = router;
