const { Op } = require('sequelize');
const { Announcement, User, Offer } = require('../models');
const config = require('../config');

/**
 * Format announcement object for response
 * @param {Object} announcement - Announcement object
 * @returns {Object} Formatted announcement object
 */
const formatAnnouncementResponse = (announcement) => {
  const response = {
    id: announcement.id,
    title: announcement.title,
    description: announcement.description,
    price: parseFloat(announcement.price),
    location: announcement.location,
    category: announcement.category,
    images: announcement.images,
    acceptCounterOffers: announcement.acceptCounterOffers,
    status: announcement.status,
    views: announcement.views,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };

  // Add user if included
  if (announcement.user) {
    response.user = {
      id: announcement.user.id,
      name: announcement.user.name,
      userType: announcement.user.userType,
      profileImage: announcement.user.profileImage,
      rating: announcement.user.rating,
      reviewCount: announcement.user.reviewCount,
    };
  }

  // Add offers count if included
  if (announcement.offersCount !== undefined) {
    response.offersCount = announcement.offersCount;
  }

  return response;
};

/**
 * Get all announcements
 * @route GET /api/announcements
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const {
      limit = config.pagination.limit,
      offset = config.pagination.offset,
      search,
      category,
      location,
      minPrice,
      maxPrice,
      userType,
      status = 'active',
    } = req.query;

    // Build where clause
    const where = { status };

    // Search in title and description
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by location
    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }

    // Filter by price range
    if (minPrice) {
      where.price = { ...where.price, [Op.gte]: minPrice };
    }

    if (maxPrice) {
      where.price = { ...where.price, [Op.lte]: maxPrice };
    }

    // Include user with userType filter
    const include = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount'],
      },
    ];

    if (userType) {
      include[0].where = { userType };
    }

    // Get announcements
    const { count, rows } = await Announcement.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const announcements = rows.map(formatAnnouncementResponse);

    res.status(200).json({
      status: 'success',
      data: {
        announcements,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar anúncios. Tente novamente.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get announcement by ID
 * @route GET /api/announcements/:id
 */
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get announcement
    const announcement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount'],
        },
      ],
    });

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        error: 'Anúncio não encontrado.',
      });
    }

    // Increment views
    await announcement.incrementViews();

    // Get offers count
    const offersCount = await Offer.count({
      where: { announcementId: id },
    });

    // Add offers count to announcement
    announcement.offersCount = offersCount;

    res.status(200).json({
      status: 'success',
      data: {
        announcement: formatAnnouncementResponse(announcement),
      },
    });
  } catch (error) {
    console.error('Get announcement by ID error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar anúncio. Tente novamente.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Create announcement
 * @route POST /api/announcements
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      category,
      images,
      acceptCounterOffers,
    } = req.body;

    // Create announcement
    const announcement = await Announcement.create({
      userId: req.user.id,
      title,
      description,
      price,
      location,
      category,
      type: 'service', // Valor padrão válido para o campo type
      images: images || [],
      acceptCounterOffers: acceptCounterOffers !== undefined ? acceptCounterOffers : true,
    });

    res.status(201).json({
      status: 'success',
      data: {
        announcement: formatAnnouncementResponse(announcement),
      },
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao criar anúncio. Tente novamente.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Update announcement
 * @route PUT /api/announcements/:id
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      location,
      category,
      images,
      acceptCounterOffers,
      status,
    } = req.body;

    // Get announcement
    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        error: 'Anúncio não encontrado.',
      });
    }

    // Check if user is the owner
    if (announcement.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        error: 'Você não tem permissão para atualizar este anúncio.',
      });
    }

    // Update announcement
    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (price) announcement.price = price;
    if (location) announcement.location = location;
    if (category) announcement.category = category;
    if (images) announcement.images = images;
    if (acceptCounterOffers !== undefined) announcement.acceptCounterOffers = acceptCounterOffers;
    if (status) announcement.status = status;
    // Garantir que o campo type esteja definido com valor válido
    if (!announcement.type) announcement.type = 'service';

    await announcement.save();

    res.status(200).json({
      status: 'success',
      data: {
        announcement: formatAnnouncementResponse(announcement),
      },
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao atualizar anúncio. Tente novamente.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Delete announcement
 * @route DELETE /api/announcements/:id
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // Get announcement
    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        error: 'Anúncio não encontrado.',
      });
    }

    // Check if user is the owner
    if (announcement.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        error: 'Você não tem permissão para excluir este anúncio.',
      });
    }

    // Delete announcement
    await announcement.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Anúncio excluído com sucesso.',
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao excluir anúncio. Tente novamente.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get user announcements
 * @route GET /api/announcements/user
 */
exports.getUserAnnouncements = async (req, res) => {
  try {
    const {
      limit = config.pagination.limit,
      offset = config.pagination.offset,
      status,
    } = req.query;

    // Build where clause
    const where = { userId: req.user.id };

    if (status) {
      where.status = status;
    }

    // Get announcements
    const { count, rows } = await Announcement.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Get offers count for each announcement
    const announcementsWithOffersCount = await Promise.all(
      rows.map(async (announcement) => {
        const offersCount = await Offer.count({
          where: { announcementId: announcement.id },
        });
        announcement.offersCount = offersCount;
        return announcement;
      })
    );

    // Format response
    const announcements = announcementsWithOffersCount.map(formatAnnouncementResponse);

    res.status(200).json({
      status: 'success',
      data: {
        announcements,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get user announcements error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar anúncios do usuário. Tente novamente.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
