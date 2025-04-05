const { User, Review, Document, ActivityLog } = require('../models');
const config = require('../config');

/**
 * Format user profile object for response
 * @param {Object} user - User object
 * @returns {Object} Formatted user profile object
 */
const formatUserProfileResponse = (user) => {
  const response = {
    id: user.id,
    name: user.name,
    userType: user.userType,
    profileImage: user.profileImage,
    location: user.location,
    rating: user.rating,
    reviewCount: user.reviewCount,
    isVerified: user.isVerified,
    verificationLevel: user.verificationLevel,
    reputationLevel: user.reputationLevel,
    completedDeals: user.completedDeals,
    bio: user.bio,
    specialties: user.specialties,
    website: user.website,
    createdAt: user.createdAt,
  };

  // Add documents if included
  if (user.documents) {
    response.documents = user.documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      isVerified: doc.isVerified,
      status: doc.status,
      verifiedAt: doc.verifiedAt,
    }));
  }

  // Add reviews if included
  if (user.receivedReviews) {
    response.recentReviews = user.receivedReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewer: {
        id: review.reviewer.id,
        name: review.reviewer.name,
        userType: review.reviewer.userType,
        profileImage: review.reviewer.profileImage,
      },
    }));
  }

  return response;
};

/**
 * Get user profile by ID
 * @route GET /api/users/:id
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user with documents and recent reviews
    const user = await User.findByPk(id, {
      include: [
        {
          model: Document,
          as: 'documents',
          where: { status: 'approved' },
          attributes: ['id', 'type', 'isVerified', 'status', 'verifiedAt'],
          required: false,
        },
        {
          model: Review,
          as: 'receivedReviews',
          attributes: ['id', 'rating', 'comment', 'createdAt'],
          limit: 3,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'reviewer',
              attributes: ['id', 'name', 'userType', 'profileImage'],
            },
          ],
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: 'Usuário não encontrado.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: formatUserProfileResponse(user),
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar perfil do usuário. Tente novamente.',
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { bio, specialties, website } = req.body;

    // Get user
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: 'Usuário não encontrado.',
      });
    }

    // Update user profile
    if (bio !== undefined) user.bio = bio;
    if (specialties !== undefined) user.specialties = specialties;
    if (website !== undefined) user.website = website;

    await user.save();

    // Create activity log
    await ActivityLog.create({
      userId: req.user.id,
      activityType: 'profile_updated',
      description: 'Perfil atualizado',
      isPublic: false,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: formatUserProfileResponse(user),
      },
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao atualizar perfil. Tente novamente.',
    });
  }
};

/**
 * Get user statistics
 * @route GET /api/users/:id/stats
 */
exports.getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: 'Usuário não encontrado.',
      });
    }

    // Get user statistics
    const stats = {
      rating: user.rating,
      reviewCount: user.reviewCount,
      completedDeals: user.completedDeals,
      isVerified: user.isVerified,
      verificationLevel: user.verificationLevel,
      reputationLevel: user.reputationLevel,
    };

    // Get rating distribution
    const ratingDistribution = await Review.findAll({
      attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('rating')), 'count']],
      where: { reviewedId: id },
      group: ['rating'],
      raw: true,
    });

    // Format rating distribution
    const formattedRatingDistribution = {};
    ratingDistribution.forEach(item => {
      formattedRatingDistribution[item.rating] = parseInt(item.count);
    });

    // Add missing ratings
    for (let i = 1; i <= 5; i++) {
      if (!formattedRatingDistribution[i]) {
        formattedRatingDistribution[i] = 0;
      }
    }

    stats.ratingDistribution = formattedRatingDistribution;

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar estatísticas do usuário. Tente novamente.',
    });
  }
};
