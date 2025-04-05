'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remover chaves estrangeiras que dependem da tabela Announcements
    await queryInterface.removeConstraint('Offers', 'fk_offers_announcements');
    await queryInterface.removeConstraint('Reviews', 'fk_reviews_announcements');

    // Remover a tabela Announcements
    await queryInterface.dropTable('Announcements');
  },

  down: async (queryInterface, Sequelize) => {
    // Aqui você pode adicionar a lógica para recriar a tabela se necessário
  }
};
