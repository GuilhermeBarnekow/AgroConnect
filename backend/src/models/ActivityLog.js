module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    'ActivityLog',
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
      activityType: {
        type: DataTypes.ENUM(
          'offer_created',
          'offer_accepted',
          'offer_rejected',
          'offer_completed',
          'review_given',
          'review_received',
          'document_submitted',
          'document_verified',
          'profile_updated',
          'announcement_created',
          'announcement_updated',
          'announcement_deleted',
          'login',
          'other'
        ),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Dados adicionais relacionados à atividade',
      },
      relatedId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID relacionado à atividade (oferta, anúncio, avaliação, etc.)',
      },
      relatedType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Tipo de entidade relacionada (Offer, Announcement, Review, etc.)',
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Se a atividade deve ser visível publicamente no perfil do usuário',
      },
    },
    {
      // Model options
      timestamps: true,
      paranoid: false, // Não usamos soft delete para logs
    }
  );

  // Associations
  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return ActivityLog;
};
