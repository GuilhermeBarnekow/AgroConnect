'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'isVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Users', 'verificationLevel', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '0: Não verificado, 1: Email verificado, 2: Telefone verificado, 3: Documento verificado',
    });

    await queryInterface.addColumn('Users', 'reputationLevel', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Nível de reputação baseado em avaliações e atividades',
    });

    await queryInterface.addColumn('Users', 'completedDeals', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Número de negociações concluídas',
    });

    await queryInterface.addColumn('Users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Biografia ou descrição do usuário',
    });

    await queryInterface.addColumn('Users', 'specialties', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
      comment: 'Especialidades do técnico',
    });

    await queryInterface.addColumn('Users', 'website', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Site pessoal ou profissional',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'isVerified');
    await queryInterface.removeColumn('Users', 'verificationLevel');
    await queryInterface.removeColumn('Users', 'reputationLevel');
    await queryInterface.removeColumn('Users', 'completedDeals');
    await queryInterface.removeColumn('Users', 'bio');
    await queryInterface.removeColumn('Users', 'specialties');
    await queryInterface.removeColumn('Users', 'website');
  }
};
