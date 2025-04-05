const { Offer, Announcement, User } = require('../models');
const { Op } = require('sequelize');
const config = require('../config');

/**
 * Format offer object for response
 * @param {Object} offer - Offer object
 * @returns {Object} Formatted offer object
 */
const formatOfferResponse = (offer) => {
  const response = {
    id: offer.id,
    price: parseFloat(offer.price),
    message: offer.message,
    status: offer.status,
    buyerReviewed: offer.buyerReviewed,
    sellerReviewed: offer.sellerReviewed,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
  };

  // Add user if included
  if (offer.user) {
    response.user = {
      id: offer.user.id,
      name: offer.user.name,
      userType: offer.user.userType,
      profileImage: offer.user.profileImage,
      rating: offer.user.rating,
      reviewCount: offer.user.reviewCount,
      isVerified: offer.user.isVerified,
      verificationLevel: offer.user.verificationLevel,
      reputationLevel: offer.user.reputationLevel,
      completedDeals: offer.user.completedDeals,
      specialties: offer.user.specialties,
    };
  }

  // Add announcement if included
  if (offer.announcement) {
    response.announcement = {
      id: offer.announcement.id,
      title: offer.announcement.title,
      price: parseFloat(offer.announcement.price),
      category: offer.announcement.category,
      location: offer.announcement.location,
      images: offer.announcement.images,
      status: offer.announcement.status,
      user: offer.announcement.user ? {
        id: offer.announcement.user.id,
        name: offer.announcement.user.name,
        userType: offer.announcement.user.userType,
        profileImage: offer.announcement.user.profileImage,
        rating: offer.announcement.user.rating,
        reviewCount: offer.announcement.user.reviewCount,
        isVerified: offer.announcement.user.isVerified,
        verificationLevel: offer.announcement.user.verificationLevel,
        reputationLevel: offer.announcement.user.reputationLevel,
        completedDeals: offer.announcement.user.completedDeals,
        specialties: offer.announcement.user.specialties,
      } : undefined,
    };
  }

  return response;
};

/**
 * Create offer
 * @route POST /api/offers
 */
exports.createOffer = async (req, res) => {
  try {
    const { announcementId, price, message } = req.body;

    // Get announcement
    const announcement = await Announcement.findByPk(announcementId);

    if (!announcement) {
      return res.status(404).json({
        status: 'error',
        error: 'Anúncio não encontrado.',
      });
    }

    // Check if announcement is active
    if (announcement.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        error: 'Este anúncio não está ativo.',
      });
    }

    // Check if user is not the owner
    if (announcement.userId === req.user.id) {
      return res.status(400).json({
        status: 'error',
        error: 'Você não pode fazer uma oferta para seu próprio anúncio.',
      });
    }

    // Check if price is valid
    if (price <= 0) {
      return res.status(400).json({
        status: 'error',
        error: 'O preço deve ser maior que zero.',
      });
    }

    // Check if user already has a pending offer for this announcement
    const existingOffer = await Offer.findOne({
      where: {
        userId: req.user.id,
        announcementId,
        status: 'pending',
      },
    });

    if (existingOffer) {
      return res.status(400).json({
        status: 'error',
        error: 'Você já tem uma oferta pendente para este anúncio.',
      });
    }

    // Create offer
    const offer = await Offer.create({
      userId: req.user.id,
      announcementId,
      price,
      message,
    });

    // Get offer with user and announcement
    const createdOffer = await Offer.findByPk(offer.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount', 'isVerified', 'verificationLevel', 'reputationLevel', 'completedDeals', 'specialties'],
        },
        {
          model: Announcement,
          as: 'announcement',
          attributes: ['id', 'title', 'price', 'category', 'location', 'images', 'status'],
        },
      ],
    });

    // TODO: Send notification to announcement owner

    res.status(201).json({
      status: 'success',
      data: {
        offer: formatOfferResponse(createdOffer),
      },
    });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao criar oferta. Tente novamente.',
    });
  }
};

/**
 * Get offer by ID
 * @route GET /api/offers/:id
 */
exports.getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get offer
    const offer = await Offer.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount', 'isVerified', 'verificationLevel', 'reputationLevel', 'completedDeals', 'specialties'],
        },
        {
          model: Announcement,
          as: 'announcement',
          attributes: ['id', 'title', 'price', 'category', 'location', 'images', 'status', 'userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount', 'isVerified', 'verificationLevel', 'reputationLevel', 'completedDeals', 'specialties'],
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

    // Check if user is the offer owner or announcement owner
    if (offer.userId !== req.user.id && offer.announcement.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        error: 'Você não tem permissão para visualizar esta oferta.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        offer: formatOfferResponse(offer),
      },
    });
  } catch (error) {
    console.error('Get offer by ID error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar oferta. Tente novamente.',
    });
  }
};

/**
 * Counter offer
 * @route PUT /api/offers/:id/counteroffer
 */
exports.counterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, message } = req.body;

    // Get offer
    const offer = await Offer.findByPk(id);

    if (!offer) {
      return res.status(404).json({
        status: 'error',
        error: 'Oferta não encontrada.',
      });
    }

    // Check if the offer is pending
    if (offer.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        error: 'Apenas ofertas pendentes podem receber contrapropostas.',
      });
    }

    // Update offer with new price and message
    offer.price = price;
    offer.message = message;
    // Mantém o status como 'pending' já que 'counteroffered' não existe no enum do banco de dados
    await offer.save();

    res.status(200).json({
      status: 'success',
      data: {
        offer: formatOfferResponse(offer),
      },
    });
  } catch (error) {
    console.error('Counter offer error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao fazer contraproposta. Tente novamente.',
    });
  }
}

/**
 * Update offer status
 * @route PUT /api/offers/:id/status
 */
exports.updateOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get offer
    const offer = await Offer.findByPk(id, {
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

    // Check permissions based on status
    if (status === 'accepted' || status === 'rejected') {
      // Only announcement owner can accept or reject
      if (offer.announcement.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          error: 'Você não tem permissão para aceitar ou rejeitar esta oferta.',
        });
      }
    } else if (status === 'completed') {
      // Both offer owner and announcement owner can mark as completed
      if (offer.userId !== req.user.id && offer.announcement.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          error: 'Você não tem permissão para marcar esta oferta como concluída.',
        });
      }

      // Check if offer is accepted
      if (offer.status !== 'accepted') {
        return res.status(400).json({
          status: 'error',
          error: 'Apenas ofertas aceitas podem ser marcadas como concluídas.',
        });
      }
    } else {
      return res.status(400).json({
        status: 'error',
        error: 'Status inválido.',
      });
    }

    // Update offer status
    offer.status = status;
    await offer.save();

    // If offer is accepted, reject all other pending offers for this announcement
    if (status === 'accepted') {
      await Offer.update(
        { status: 'rejected' },
        {
          where: {
            announcementId: offer.announcementId,
            id: { [Op.ne]: offer.id },
            status: 'pending',
          },
        }
      );

      // TODO: Send notifications to rejected offers
    }

    // TODO: Send notification to the other party

    res.status(200).json({
      status: 'success',
      data: {
        offer: formatOfferResponse(offer),
      },
    });
  } catch (error) {
    console.error('Update offer status error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao atualizar status da oferta. Tente novamente.',
    });
  }
};

/**
 * Get user offers
 * @route GET /api/offers/user
 */
exports.getUserOffers = async (req, res) => {
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

    // Get offers
    const { count, rows } = await Offer.findAndCountAll({
      where,
      include: [
        {
          model: Announcement,
          as: 'announcement',
          attributes: ['id', 'title', 'price', 'category', 'location', 'images', 'status'],
          include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount', 'isVerified', 'verificationLevel', 'reputationLevel', 'completedDeals', 'specialties'],
        },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const offers = rows.map(formatOfferResponse);

    res.status(200).json({
      status: 'success',
      data: {
        offers,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get user offers error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar ofertas do usuário. Tente novamente.',
    });
  }
};

/**
 * Get received offers
 * @route GET /api/offers/received
 */
exports.getReceivedOffers = async (req, res) => {
  try {
    const {
      limit = config.pagination.limit,
      offset = config.pagination.offset,
      status,
      announcementId,
    } = req.query;

    // Build where clause for announcements
    const announcementWhere = { userId: req.user.id };

    if (announcementId) {
      announcementWhere.id = announcementId;
    }

    // Build where clause for offers
    const offerWhere = {};

    if (status) {
      offerWhere.status = status;
    }

    // Get offers
    const { count, rows } = await Offer.findAndCountAll({
      where: offerWhere,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount', 'isVerified', 'verificationLevel', 'reputationLevel', 'completedDeals', 'specialties'],
        },
        {
          model: Announcement,
          as: 'announcement',
          attributes: ['id', 'title', 'price', 'category', 'location', 'images', 'status'],
          where: announcementWhere,
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const offers = rows.map(formatOfferResponse);

    res.status(200).json({
      status: 'success',
      data: {
        offers,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get received offers error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar ofertas recebidas. Tente novamente.',
    });
  }
};

/**
 * Get announcement offers
 * @route GET /api/offers/announcement/:id
 */
exports.getAnnouncementOffers = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      limit = config.pagination.limit,
      offset = config.pagination.offset,
      status,
    } = req.query;

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
        error: 'Você não tem permissão para visualizar as ofertas deste anúncio.',
      });
    }

    // Build where clause
    const where = { announcementId: id };

    if (status) {
      where.status = status;
    }

    // Get offers
    const { count, rows } = await Offer.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage', 'rating', 'reviewCount', 'isVerified', 'verificationLevel', 'reputationLevel', 'completedDeals', 'specialties'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const offers = rows.map(formatOfferResponse);

    res.status(200).json({
      status: 'success',
      data: {
        offers,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get announcement offers error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar ofertas do anúncio. Tente novamente.',
    });
  }
};
