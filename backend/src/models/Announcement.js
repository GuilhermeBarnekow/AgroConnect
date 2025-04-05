module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define(
    'Announcement',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [5, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [20, 2000],
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      category: {
        type: DataTypes.ENUM('Maquinário', 'Consultoria', 'Serviços', 'Insumos', 'Outros'),
        allowNull: false,
        validate: {
          isIn: [['Maquinário', 'Consultoria', 'Serviços', 'Insumos', 'Outros']],
        },
      },
      type: {
        type: DataTypes.ENUM('service', 'machinery'),
        allowNull: false,
        defaultValue: 'service',
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      acceptCounterOffers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
          isIn: [['active', 'pending', 'completed', 'cancelled']],
        },
      },
      views: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
    },
    {
      // Model options
      timestamps: true,
      paranoid: true, // Soft delete
    }
  );

  // Increment views
  Announcement.prototype.incrementViews = async function () {
    this.views += 1;
    return this.save();
  };

  // Associations
  Announcement.associate = (models) => {
    Announcement.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Announcement.hasMany(models.Offer, {
      foreignKey: 'announcementId',
      as: 'offers',
    });
  };

  return Announcement;
};
