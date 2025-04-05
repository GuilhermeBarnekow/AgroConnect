'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Announcements');
  },

  down: async (queryInterface, Sequelize) => {
    // Aqui você pode adicionar a lógica para recriar a tabela se necessário
  }
};
