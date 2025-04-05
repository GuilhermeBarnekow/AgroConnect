const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 100],
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [6, 100],
        },
      },
      userType: {
        type: DataTypes.ENUM('produtor', 'técnico'),
        allowNull: false,
        validate: {
          isIn: [['produtor', 'técnico']],
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^\(\d{2}\) \d{5}-\d{4}$/,
        },
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fcmToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rating: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 5,
        },
      },
      reviewCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // Novos campos para verificação e reputação
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verificationLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Não verificado, 1: Email verificado, 2: Telefone verificado, 3: Documento verificado',
      },
      reputationLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Nível de reputação baseado em avaliações e atividades',
      },
      completedDeals: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Número de negociações concluídas',
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Biografia ou descrição do usuário',
      },
      specialties: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        comment: 'Especialidades do técnico',
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Site pessoal ou profissional',
      },
    },
    {
      // Model options
      timestamps: true,
      paranoid: true, // Soft delete
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
    }
  );

  // Hash password before saving
  User.beforeCreate(async (user) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Update user rating
  User.prototype.updateRating = async function (rating) {
    const newReviewCount = this.reviewCount + 1;
    const newRating =
      (this.rating * this.reviewCount + rating) / newReviewCount;

    this.reviewCount = newReviewCount;
    this.rating = parseFloat(newRating.toFixed(1));

    return this.save();
  };

  // Associations
  User.associate = (models) => {
    User.hasMany(models.Announcement, {
      foreignKey: 'userId',
      as: 'announcements',
    });

    User.hasMany(models.Offer, {
      foreignKey: 'userId',
      as: 'offers',
    });

    User.hasMany(models.Review, {
      foreignKey: 'reviewerId',
      as: 'givenReviews',
    });

    User.hasMany(models.Review, {
      foreignKey: 'reviewedId',
      as: 'receivedReviews',
    });

    // Novas associações
    User.hasMany(models.Document, {
      foreignKey: 'userId',
      as: 'documents',
    });

    User.hasMany(models.Document, {
      foreignKey: 'verifiedBy',
      as: 'verifiedDocuments',
    });

    User.hasMany(models.ActivityLog, {
      foreignKey: 'userId',
      as: 'activityLogs',
    });
  };

  return User;
};
