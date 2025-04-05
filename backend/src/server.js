const app = require('./app');
const config = require('./config');
const { sequelize } = require('./models');

// Start the server
const startServer = async () => {
  let retries = 5;
  let server;
  
  while (retries) {
    try {
      // Test database connection
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');

      // Start the server
      server = app.listen(config.server.port, () => {
        console.log(`
        ################################################
        🚀 Server listening on port ${config.server.port} 🚀
        ################################################
        Environment: ${config.server.env}
        Database: ${config.database.name} @ ${config.database.host}
        ################################################
        `);
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (err) => {
        console.error('UNHANDLED REJECTION! 💥 Shutting down...');
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
        if (server) {
          server.close(() => {
            process.exit(1);
          });
        } else {
          process.exit(1);
        }
      });

      // Handle uncaught exceptions
      process.on('uncaughtException', (err) => {
        console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
        if (server) {
          server.close(() => {
            process.exit(1);
          });
        } else {
          process.exit(1);
        }
      });

      // Handle SIGTERM signal
      process.on('SIGTERM', () => {
        console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
        if (server) {
          server.close(() => {
            console.log('💥 Process terminated!');
          });
        }
      });
      
      // If we get here, we've successfully connected and started the server
      break;
    } catch (error) {
      retries -= 1;
      console.error(`Unable to connect to the database (${5 - retries}/5 attempts):`, error);
      
      if (retries === 0) {
        console.error('Maximum retries reached. Exiting process.');
        process.exit(1);
      }
      
      console.log(`Retrying in 5 seconds...`);
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Start the server
startServer();
