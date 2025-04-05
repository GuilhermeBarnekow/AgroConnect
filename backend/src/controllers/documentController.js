const { Document, User, ActivityLog } = require('../models');
const config = require('../config');

/**
 * Format document object for response
 * @param {Object} document - Document object
 * @returns {Object} Formatted document object
 */
const formatDocumentResponse = (document) => {
  const response = {
    id: document.id,
    type: document.type,
    documentNumber: document.documentNumber,
    documentUrl: document.documentUrl,
    isVerified: document.isVerified,
    status: document.status,
    verifiedAt: document.verifiedAt,
    expiresAt: document.expiresAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };

  // Add user if included
  if (document.user) {
    response.user = {
      id: document.user.id,
      name: document.user.name,
      userType: document.user.userType,
      profileImage: document.user.profileImage,
    };
  }

  // Add verifier if included
  if (document.verifier) {
    response.verifier = {
      id: document.verifier.id,
      name: document.verifier.name,
    };
  }

  return response;
};

/**
 * Submit document for verification
 * @route POST /api/documents
 */
exports.submitDocument = async (req, res) => {
  try {
    const { type, documentNumber, documentUrl } = req.body;

    // Validate document type
    const validTypes = ['cpf', 'cnpj', 'rg', 'crea', 'diploma', 'certificado', 'outro'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        status: 'error',
        error: 'Tipo de documento inválido.',
      });
    }

    // Check if document already exists
    const existingDocument = await Document.findOne({
      where: {
        userId: req.user.id,
        type,
        status: ['pending', 'approved'],
      },
    });

    if (existingDocument) {
      return res.status(400).json({
        status: 'error',
        error: 'Você já possui um documento deste tipo em análise ou aprovado.',
      });
    }

    // Create document
    const document = await Document.create({
      userId: req.user.id,
      type,
      documentNumber: documentNumber || null,
      documentUrl,
      status: 'pending',
    });

    // Create activity log
    await ActivityLog.create({
      userId: req.user.id,
      activityType: 'document_submitted',
      description: `Documento ${type} enviado para verificação`,
      relatedId: document.id.toString(),
      relatedType: 'Document',
      isPublic: false,
    });

    // Get document with user
    const createdDocument = await Document.findByPk(document.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage'],
        },
      ],
    });

    res.status(201).json({
      status: 'success',
      data: {
        document: formatDocumentResponse(createdDocument),
      },
    });
  } catch (error) {
    console.error('Submit document error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao enviar documento. Tente novamente.',
    });
  }
};

/**
 * Get user documents
 * @route GET /api/documents
 */
exports.getUserDocuments = async (req, res) => {
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

    // Get documents
    const { count, rows } = await Document.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'name'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const documents = rows.map(formatDocumentResponse);

    res.status(200).json({
      status: 'success',
      data: {
        documents,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get user documents error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar documentos. Tente novamente.',
    });
  }
};

/**
 * Get document by ID
 * @route GET /api/documents/:id
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get document
    const document = await Document.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'userType', 'profileImage'],
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        error: 'Documento não encontrado.',
      });
    }

    // Check if user is the document owner or an admin
    if (document.userId !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        error: 'Você não tem permissão para visualizar este documento.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        document: formatDocumentResponse(document),
      },
    });
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar documento. Tente novamente.',
    });
  }
};

/**
 * Verify document (admin only)
 * @route PUT /api/documents/:id/verify
 */
exports.verifyDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        error: 'Apenas administradores podem verificar documentos.',
      });
    }

    // Get document
    const document = await Document.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'verificationLevel'],
        },
      ],
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        error: 'Documento não encontrado.',
      });
    }

    // Check if document is pending
    if (document.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        error: 'Este documento já foi verificado.',
      });
    }

    // Update document status
    document.status = status;
    document.isVerified = status === 'approved';
    document.verifiedAt = status === 'approved' ? new Date() : null;
    document.verifiedBy = status === 'approved' ? req.user.id : null;
    document.rejectionReason = status === 'rejected' ? rejectionReason : null;
    await document.save();

    // If approved, update user verification level
    if (status === 'approved') {
      const user = document.user;
      
      // Update verification level if it's higher than current level
      if (user.verificationLevel < 3) {
        user.verificationLevel = 3;
        user.isVerified = true;
        await user.save();
      }

      // Create activity log
      await ActivityLog.create({
        userId: document.userId,
        activityType: 'document_verified',
        description: `Documento ${document.type} verificado com sucesso`,
        relatedId: document.id.toString(),
        relatedType: 'Document',
        isPublic: true,
        metadata: {
          documentType: document.type,
        },
      });
    } else {
      // Create activity log for rejection
      await ActivityLog.create({
        userId: document.userId,
        activityType: 'document_rejected',
        description: `Documento ${document.type} rejeitado: ${rejectionReason}`,
        relatedId: document.id.toString(),
        relatedType: 'Document',
        isPublic: false,
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        document: formatDocumentResponse(document),
      },
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao verificar documento. Tente novamente.',
    });
  }
};

/**
 * Delete document
 * @route DELETE /api/documents/:id
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Get document
    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        status: 'error',
        error: 'Documento não encontrado.',
      });
    }

    // Check if user is the document owner
    if (document.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        error: 'Você não tem permissão para excluir este documento.',
      });
    }

    // Check if document is already verified
    if (document.status === 'approved') {
      return res.status(400).json({
        status: 'error',
        error: 'Documentos verificados não podem ser excluídos.',
      });
    }

    // Delete document
    await document.destroy();

    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao excluir documento. Tente novamente.',
    });
  }
};
