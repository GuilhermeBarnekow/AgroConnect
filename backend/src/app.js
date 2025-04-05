const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorMiddleware = require('./middlewares/errorMiddleware');

const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const announcementsRoutes = require('./routes/announcements');
const offersRoutes = require('./routes/offers');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes = require('./routes/users');
const documentsRoutes = require('./routes/documents');
const activitiesRoutes = require('./routes/activities');

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors(config.cors)); // CORS configuration
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan(config.server.env === 'development' ? 'dev' : 'combined')); // HTTP request logger

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/activities', activitiesRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    
    res.status(200).json({
      status: 'success',
      message: 'AgroConnect API is running',
      environment: config.server.env,
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        name: config.database.name,
        host: config.database.host,
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'AgroConnect API is running but database connection failed',
      environment: config.server.env,
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message,
      }
    });
  }
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to AgroConnect API',
    version: '1.0.0',
    documentation: 'API documentation will be available soon',
  });
});

// Error handling middleware
app.use(errorMiddleware);


module.exports = app;
