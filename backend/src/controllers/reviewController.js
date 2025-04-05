const { Review, User, Offer, Announcement } = require('../models');
const config = require('../config');

/**
 * Format review object for response
 * @param {Object} review - Review object
 * @returns {Object} Formatted review object
 */
const formatReviewResponse = (review) => {
  const response = {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    reviewerType: review.reviewerType,
    createdAt: review.createdAt,
  };

  // Add reviewer if included
  if (review.reviewer) {
    response.reviewer = {
      id: review.reviewer.id,
      name: review.reviewer.name,
      userType: review.reviewer.userType,
      profileImage: review.reviewer.profileImage,
      rating: review.reviewer.rating,
      reviewCount: review.reviewer.reviewCount,
    };
  }

  // Add reviewed if included
  if (review.reviewed) {
    response.reviewed = {
      id: review.reviewed.id,
      name: review.reviewed.name,
      userType: review.reviewed.userType,
      profileImage: review.reviewed.profileImage,
      rating: review.reviewed.rating,
      reviewCount: review.reviewed.reviewCount,
    };
  }

  // Add offer if included
  if (review.offer) {
    response.offer = {
      id: review.offer.id,
      price: parseFloat(review.offer.price),
      status: review.offer.status,
      createdAt: review.offer.createdAt,
    };

    // Add announcement if included
    if (review.offer.announcement) {
      response.offer.announcement = {
        id: review.offer.announcement.id,
        title: review.offer.announcement.title,
        price: parseFloat(review.offer.announcement.price),
        category: review.offer.announcement.category,
      };
    }
  }

  return response;
};

/**
 * Create review
 * @route POST /api/reviews
 */
exports.createReview = async (req, res) => {
  try {
    const { offerId, rating, comment } = req.body;

    // Get offer
    const offer = await Offer.findByPk(offerId, {
      include: [
        {
          model: Announcement,
          as: 'announcement',
          attributes: ['userId'],
        },
      ],
    });

    if (!offer) {
      return res.status(404).json({
        status: 'error',
        error: 'Oferta não encontrada.',
      });
    }

    // Check if offer is completed
    if (offer.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        error: 'Apenas ofertas concluídas podem ser avaliadas.',
      });
    }

    // Determine reviewer type and reviewed user ID
    let reviewerType;
    let reviewedId;

    if (req.user.id === offer.userId) {
      // User is the buyer (offer creator)
      reviewerType = 'buyer';
      reviewedId = offer.announcement.userId;

      // Check if buyer already reviewed
      if (offer.buyerReviewed) {
        return res.status(400).json({
          status: 'error',
          error: 'Você já avaliou esta oferta.',
        });
      }
    } else if (req.user.id === offer.announcement.userId) {
      // User is the seller (announcement owner)
      reviewerType = 'seller';
      reviewedId = offer.userId;

      // Check if seller already reviewed
      if (offer.sellerReviewed) {
        return res.status(400).json({
          status: 'error',
          error: 'Você já avaliou esta oferta.',
        });
      }
    } else {
      return res.status(403).json({
        status: 'error',
        error: 'Você não tem permissão para avaliar esta oferta.',
      });
    }

    // Create review
    const reviewData = {
      reviewerId: req.user.id,
      reviewedId,
      offerId,
      rating,
      comment,
      reviewerType,
    };
    
    // Usar o método build e save para ter mais controle sobre o processo
    const review = Review.build(reviewData);
    await review.save();

    // Get review with associations
    const createdReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount'],
        },
        {
          model: User,
          as: 'reviewed',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount'],
        },
        {
          model: Offer,
          as: 'offer',
          attributes: ['id', 'price', 'status', 'createdAt'],
          include: [
            {
              model: Announcement,
              as: 'announcement',
              attributes: ['id', 'title', 'price', 'category'],
            },
          ],
        },
      ],
    });

    // TODO: Send notification to reviewed user

    res.status(201).json({
      status: 'success',
      data: {
        review: formatReviewResponse(createdReview),
      },
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao criar avaliação. Tente novamente.',
    });
  }
};

/**
 * Check if user can review an offer
 * @route GET /api/reviews/check/:offerId
 */
exports.checkCanReview = async (req, res) => {
  try {
    const { offerId } = req.params;

    // Get offer
    const offer = await Offer.findByPk(offerId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount'],
        },
        {
          model: Announcement,
          as: 'announcement',
          attributes: ['userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount'],
            },
          ],
        },
      ],
    });

    if (!offer) {
      return res.status(404).json({
        status: 'error',
        error: 'Oferta não encontrada.',
      });
    }

    // Check if offer is completed
    if (offer.status !== 'completed') {
      return res.status(200).json({
        status: 'success',
        data: {
          canReview: false,
          reason: 'Apenas ofertas concluídas podem ser avaliadas.',
        },
      });
    }

    // Determine reviewer type and reviewed user
    let canReview = false;
    let reviewedUser = null;
    let reason = '';

    if (req.user.id === offer.userId) {
      // User is the buyer (offer creator)
      if (offer.buyerReviewed) {
        reason = 'Você já avaliou esta oferta.';
      } else {
        canReview = true;
        reviewedUser = offer.announcement.user;
      }
    } else if (req.user.id === offer.announcement.userId) {
      // User is the seller (announcement owner)
      if (offer.sellerReviewed) {
        reason = 'Você já avaliou esta oferta.';
      } else {
        canReview = true;
        reviewedUser = offer.user;
      }
    } else {
      reason = 'Você não tem permissão para avaliar esta oferta.';
    }

    res.status(200).json({
      status: 'success',
      data: {
        canReview,
        reviewedUser: canReview ? reviewedUser : null,
        reason: canReview ? null : reason,
      },
    });
  } catch (error) {
    console.error('Check can review error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao verificar permissão para avaliação. Tente novamente.',
    });
  }
};

/**
 * Get reviews given by user
 * @route GET /api/reviews/given
 */
exports.getGivenReviews = async (req, res) => {
  try {
    const {
      limit = config.pagination.limit,
      offset = config.pagination.offset,
    } = req.query;

    // Get reviews
    const { count, rows } = await Review.findAndCountAll({
      where: { reviewerId: req.user.id },
      include: [
        {
          model: User,
          as: 'reviewed',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount'],
        },
        {
          model: Offer,
          as: 'offer',
          attributes: ['id', 'price', 'status', 'createdAt'],
          include: [
            {
              model: Announcement,
              as: 'announcement',
              attributes: ['id', 'title', 'price', 'category'],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const reviews = rows.map(formatReviewResponse);

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get given reviews error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar avaliações dadas. Tente novamente.',
    });
  }
};

/**
 * Get reviews received by user
 * @route GET /api/reviews/received
 */
exports.getReceivedReviews = async (req, res) => {
  try {
    const {
      limit = config.pagination.limit,
      offset = config.pagination.offset,
    } = req.query;

    // Get reviews
    const { count, rows } = await Review.findAndCountAll({
      where: { reviewedId: req.user.id },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount'],
        },
        {
          model: Offer,
          as: 'offer',
          attributes: ['id', 'price', 'status', 'createdAt'],
          include: [
            {
              model: Announcement,
              as: 'announcement',
              attributes: ['id', 'title', 'price', 'category'],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const reviews = rows.map(formatReviewResponse);

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get received reviews error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar avaliações recebidas. Tente novamente.',
    });
  }
};

/**
 * Get user reviews
 * @route GET /api/reviews/user/:id
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      limit = config.pagination.limit,
      offset = config.pagination.offset,
    } = req.query;

    // Check if user exists
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: 'Usuário não encontrado.',
      });
    }

    // Get reviews
    const { count, rows } = await Review.findAndCountAll({
      where: { reviewedId: id },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount'],
        },
        {
          model: Offer,
          as: 'offer',
          attributes: ['id', 'price', 'status', 'createdAt'],
          include: [
            {
              model: Announcement,
              as: 'announcement',
              attributes: ['id', 'title', 'price', 'category'],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const reviews = rows.map(formatReviewResponse);

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar avaliações do usuário. Tente novamente.',
    });
  }
};
