module.exports = (sequelize, DataTypes) => {
  const Offer = sequelize.define(
    'Offer',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      announcementId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Announcements',
          key: 'id',
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
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed', 'counteroffered'),

        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'accepted', 'rejected', 'completed', 'counteroffered']],
        },
      },
      buyerReviewed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sellerReviewed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      // Model options
      timestamps: true,
      paranoid: true, // Soft delete
    }
  );

  // Check if user can review
  Offer.prototype.canReview = function (userId, userType) {
    // Only completed offers can be reviewed
    if (this.status !== 'completed') {
      return false;
    }

    // Check if user has already reviewed
    if (userType === 'buyer' && this.buyerReviewed) {
      return false;
    }

    if (userType === 'seller' && this.sellerReviewed) {
      return false;
    }

    return true;
  };

  // Mark as reviewed
  Offer.prototype.markAsReviewed = async function (userType) {
    if (userType === 'buyer') {
      this.buyerReviewed = true;
    } else if (userType === 'seller') {
      this.sellerReviewed = true;
    }

    return this.save();
  };

  // Associations
  Offer.associate = (models) => {
    Offer.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Offer.belongsTo(models.Announcement, {
      foreignKey: 'announcementId',
      as: 'announcement',
    });

    Offer.hasMany(models.Review, {
      foreignKey: 'offerId',
      as: 'reviews',
    });
  };

  return Offer;
};
