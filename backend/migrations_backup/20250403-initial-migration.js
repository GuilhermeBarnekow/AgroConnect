'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Criar tipos ENUM com verificação de existência
    const createEnumIfNotExists = async (enumName, values) => {
      try {
        await queryInterface.sequelize.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName}') THEN
              CREATE TYPE "${enumName}" AS ENUM (${values.map(v => `'${v}'`).join(', ')});
            END IF;
          END
          $$;
        `);
      } catch (error) {
        console.log(`Enum ${enumName} já existe ou erro ao criar:`, error.message);
      }
    };

    // Criar os tipos ENUM
    await createEnumIfNotExists('enum_Users_userType', ['produtor', 'técnico']);
    await createEnumIfNotExists('enum_Announcements_category', ['Maquinário', 'Consultoria', 'Serviços', 'Insumos', 'Outros']);
    await createEnumIfNotExists('enum_Announcements_type', ['service', 'machinery']);
    await createEnumIfNotExists('enum_Announcements_status', ['active', 'pending', 'completed', 'cancelled']);
    await createEnumIfNotExists('enum_Offers_status', ['pending', 'accepted', 'rejected', 'completed']);
    await createEnumIfNotExists('enum_Reviews_reviewerType', ['buyer', 'seller']);

    // Create Users table
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      userType: {
        type: "enum_Users_userType",
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      profileImage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fcmToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rating: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      reviewCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Create Announcements table
    await queryInterface.createTable('Announcements', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: "enum_Announcements_category",
        allowNull: false,
      },
      type: {
        type: "enum_Announcements_type",
        allowNull: false,
        defaultValue: 'service',
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
      },
      acceptCounterOffers: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: "enum_Announcements_status",
        allowNull: false,
        defaultValue: 'active',
      },
      views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Create Offers table
    await queryInterface.createTable('Offers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      announcementId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Announcements',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: "enum_Offers_status",
        allowNull: false,
        defaultValue: 'pending',
      },
      buyerReviewed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sellerReviewed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Create Reviews table
    await queryInterface.createTable('Reviews', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      reviewerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      reviewedId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      offerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Offers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reviewerType: {
        type: "enum_Reviews_reviewerType",
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Create indexes
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Announcements', ['userId']);
    await queryInterface.addIndex('Announcements', ['category']);
    await queryInterface.addIndex('Announcements', ['status']);
    await queryInterface.addIndex('Offers', ['userId']);
    await queryInterface.addIndex('Offers', ['announcementId']);
    await queryInterface.addIndex('Offers', ['status']);
    await queryInterface.addIndex('Reviews', ['reviewerId']);
    await queryInterface.addIndex('Reviews', ['reviewedId']);
    await queryInterface.addIndex('Reviews', ['offerId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('Reviews');
    await queryInterface.dropTable('Offers');
    await queryInterface.dropTable('Announcements');
    await queryInterface.dropTable('Users');

    // Drop enum types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Users_userType";
      DROP TYPE IF EXISTS "enum_Announcements_category";
      DROP TYPE IF EXISTS "enum_Announcements_type";
      DROP TYPE IF EXISTS "enum_Announcements_status";
      DROP TYPE IF EXISTS "enum_Offers_status";
      DROP TYPE IF EXISTS "enum_Reviews_reviewerType";
    `);
  }
};
