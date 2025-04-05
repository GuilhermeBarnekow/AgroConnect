const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      userType: user.userType,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
};

/**
 * Format user object for response
 * @param {Object} user - User object
 * @returns {Object} Formatted user object
 */
const formatUserResponse = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.userType,
    phone: user.phone,
    location: user.location,
    profileImage: user.profileImage,
    rating: user.rating,
    reviewCount: user.reviewCount,
    createdAt: user.createdAt,
  };
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { name, email, password, userType, phone, location } = req.body;

    console.log('Checking if email already exists:', email);
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({
        status: 'error',
        error: 'Este email já está em uso.',
      });
    }

    console.log('Creating new user with data:', { name, email, password, userType, phone, location });
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      userType,
      phone,
      location,
    });
    console.log('User created successfully:', user.id);

    // Generate token
    console.log('Generating token for user:', user.id);
    const token = generateToken(user);

    console.log('Registration successful for user:', user.id);
    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Check for specific error types
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors.map(e => ({ field: e.path, message: e.message })));
      return res.status(400).json({
        status: 'error',
        error: 'Dados inválidos. Verifique os campos e tente novamente.',
        details: error.errors.map(e => ({ field: e.path, message: e.message })),
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Unique constraint error:', error.errors.map(e => ({ field: e.path, message: e.message })));
      return res.status(400).json({
        status: 'error',
        error: 'Este email já está em uso.',
      });
    }
    
    res.status(500).json({
      status: 'error',
      error: 'Erro ao registrar usuário. Tente novamente.',
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    const { email, password } = req.body;

    console.log('Finding user with email:', email);
    // Find user with password
    const user = await User.scope('withPassword').findOne({ where: { email } });

    // Check if user exists
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({
        status: 'error',
        error: 'Email ou senha incorretos.',
      });
    }

    console.log('User found:', user.id);

    // Check if user is active
    if (!user.active) {
      console.log('User account is inactive:', user.id);
      return res.status(401).json({
        status: 'error',
        error: 'Conta desativada. Entre em contato com o suporte.',
      });
    }

    console.log('Checking password for user:', user.id);
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', user.id);
      return res.status(401).json({
        status: 'error',
        error: 'Email ou senha incorretos.',
      });
    }

    console.log('Password is valid for user:', user.id);

    // Generate token
    console.log('Generating token for user:', user.id);
    const token = generateToken(user);

    console.log('Login successful for user:', user.id);
    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      status: 'error',
      error: 'Erro ao fazer login. Tente novamente.',
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 */
exports.getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: formatUserResponse(req.user),
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao obter usuário. Tente novamente.',
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location, profileImage, fcmToken } = req.body;

    // Update user
    const user = req.user;
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (profileImage) user.profileImage = profileImage;
    if (fcmToken) user.fcmToken = fcmToken;

    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao atualizar perfil. Tente novamente.',
    });
  }
};

/**
 * Change password
 * @route PUT /api/auth/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.scope('withPassword').findByPk(req.user.id);

    // Check current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        error: 'Senha atual incorreta.',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Senha alterada com sucesso.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao alterar senha. Tente novamente.',
    });
  }
};

/**
 * Delete account
 * @route DELETE /api/auth/account
 */
exports.deleteAccount = async (req, res) => {
  try {
    // Soft delete user
    const user = req.user;
    user.active = false;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Conta desativada com sucesso.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Erro ao desativar conta. Tente novamente.',
    });
  }
};
