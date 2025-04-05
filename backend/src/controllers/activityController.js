const { ActivityLog, User } = require('../models');
const config = require('../config');

/**
 * Format activity log object for response
 * @param {Object} activity - Activity log object
 * @returns {Object} Formatted activity log object
 */
const formatActivityResponse = (activity) => {
  const response = {
    id: activity.id,
    activityType: activity.activityType,
    description: activity.description,
    metadata: activity.metadata,
    relatedId: activity.relatedId,
    relatedType: activity.relatedType,
    isPublic: activity.isPublic,
    createdAt: activity.createdAt,
  };

  // Add user if included
  if (activity.user) {
    response.user = {
      id: activity.user.id,
      name: activity.user.name,
      userType: activity.user.userType,
      profileImage: activity.user.profileImage,
    };
  }

  return response;
};

/**
 * Get user activity logs
 * @route GET /api/activities
 */
exports.getUserActivities = async (req, res) => {
  try {
    const {
      limit = config.pagination.limit,
      offset = config.pagination.offset,
      public = false,
    } = req.query;

    // Build where clause
    const where = { userId: req.user.id };

    if (public === 'true') {
      where.isPublic = true;
    }

    // Get activity logs
    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const activities = rows.map(formatActivityResponse);

    res.status(200).json({
      status: 'success',
      data: {
        activities,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar atividades. Tente novamente.',
    });
  }
};

/**
 * Get public activities of a user
 * @route GET /api/activities/user/:id
 */
exports.getUserPublicActivities = async (req, res) => {
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

    // Get activity logs
    const { count, rows } = await ActivityLog.findAndCountAll({
      where: {
        userId: id,
        isPublic: true,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const activities = rows.map(formatActivityResponse);

    res.status(200).json({
      status: 'success',
      data: {
        activities,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get user public activities error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar atividades. Tente novamente.',
    });
  }
};

/**
 * Create activity log (internal use only)
 * @param {Object} data - Activity log data
 * @returns {Promise<Object>} Created activity log
 */
exports.createActivityLog = async (data) => {
  try {
    const { userId, activityType, description, metadata, relatedId, relatedType, isPublic } = data;

    // Create activity log
    const activity = await ActivityLog.create({
      userId,
      activityType,
      description,
      metadata: metadata || null,
      relatedId: relatedId || null,
      relatedType: relatedType || null,
      isPublic: isPublic || false,
    });

    return activity;
  } catch (error) {
    console.error('Create activity log error:', error);
    throw error;
  }
};
