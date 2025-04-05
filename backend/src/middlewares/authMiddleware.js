const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        error: 'Não autorizado. Token não fornecido ou formato inválido.',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({
        status: 'error',
        error: 'Token expirado. Faça login novamente.',
      });
    }
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        error: 'Usuário não encontrado.',
      });
    }
    
    if (!user.active) {
      return res.status(401).json({
        status: 'error',
        error: 'Conta desativada. Entre em contato com o suporte.',
      });
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        error: 'Token inválido.',
      });
    }
    
    console.error('Auth middleware error:', error);
    
    return res.status(500).json({
      status: 'error',
      error: 'Erro interno do servidor.',
    });
  }
};

/**
 * Authorization middleware
 * Checks if user has required role
 * @param {string[]} roles - Array of allowed roles
 */
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        error: 'Não autorizado. Faça login primeiro.',
      });
    }
    
    if (roles.length && !roles.includes(req.user.userType)) {
      return res.status(403).json({
        status: 'error',
        error: 'Acesso proibido. Você não tem permissão para acessar este recurso.',
      });
    }
    
    next();
  };
};

/**
 * Owner middleware
 * Checks if user is the owner of a resource
 * @param {string} paramName - Name of the parameter containing the resource ID
 * @param {string} model - Model name
 * @param {string} userIdField - Field name containing the user ID in the model
 */
exports.isOwner = (paramName, model, userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          error: 'Não autorizado. Faça login primeiro.',
        });
      }
      
      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        return res.status(400).json({
          status: 'error',
          error: `Parâmetro ${paramName} não fornecido.`,
        });
      }
      
      const Model = require('../models')[model];
      const resource = await Model.findByPk(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          status: 'error',
          error: 'Recurso não encontrado.',
        });
      }
      
      if (resource[userIdField] !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          error: 'Acesso proibido. Você não é o proprietário deste recurso.',
        });
      }
      
      // Attach resource to request
      req.resource = resource;
      
      next();
    } catch (error) {
      console.error('isOwner middleware error:', error);
      
      return res.status(500).json({
        status: 'error',
        error: 'Erro interno do servidor.',
      });
    }
  };
};
