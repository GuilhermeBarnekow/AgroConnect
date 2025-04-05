module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    'Review',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reviewerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      reviewedId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      offerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Offers',
          key: 'id',
        },
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reviewerType: {
        type: DataTypes.ENUM('buyer', 'seller'),
        allowNull: false,
        validate: {
          isIn: [['buyer', 'seller']],
        },
      },
    },
    {
      // Model options
      timestamps: true,
      paranoid: true, // Soft delete
    }
  );

  // Associations
  Review.associate = (models) => {
    Review.belongsTo(models.User, {
      foreignKey: 'reviewerId',
      as: 'reviewer',
    });

    Review.belongsTo(models.User, {
      foreignKey: 'reviewedId',
      as: 'reviewed',
    });

    Review.belongsTo(models.Offer, {
      foreignKey: 'offerId',
      as: 'offer',
    });
  };

  // Hooks
  Review.afterCreate(async (review, options) => {
    try {
      // Update user rating
      const { User } = sequelize.models;
      const user = await User.findByPk(review.reviewedId);
      
      if (user) {
        await user.updateRating(review.rating);
      }

      // Mark offer as reviewed
      const { Offer } = sequelize.models;
      const offer = await Offer.findByPk(review.offerId);
      
      if (offer) {
        await offer.markAsReviewed(review.reviewerType);
      }
    } catch (error) {
      console.error('Error in Review afterCreate hook:', error);
    }
  });

  return Review;
};
