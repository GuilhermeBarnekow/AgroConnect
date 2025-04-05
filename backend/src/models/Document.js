module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    'Document',
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
      type: {
        type: DataTypes.ENUM('cpf', 'cnpj', 'rg', 'crea', 'diploma', 'certificado', 'outro'),
        allowNull: false,
        validate: {
          isIn: [['cpf', 'cnpj', 'rg', 'crea', 'diploma', 'certificado', 'outro']],
        },
      },
      documentNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      documentUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      verifiedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'approved', 'rejected']],
        },
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      // Model options
      timestamps: true,
      paranoid: true, // Soft delete
    }
  );

  // Associations
  Document.associate = (models) => {
    Document.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Document.belongsTo(models.User, {
      foreignKey: 'verifiedBy',
      as: 'verifier',
    });
  };

  return Document;
};
