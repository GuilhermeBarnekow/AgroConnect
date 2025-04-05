'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Adiciona o tipo ENUM para a categoria
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_announcements_category" AS ENUM ('Maquinário', 'Consultoria', 'Serviços', 'Insumos', 'Outros');`
      );
      console.log('Tipo ENUM para categoria criado');

      // Adiciona a coluna category à tabela announcements
      await queryInterface.addColumn('announcements', 'category', {
        type: Sequelize.ENUM('Maquinário', 'Consultoria', 'Serviços', 'Insumos', 'Outros'),
        allowNull: false,
        defaultValue: 'Outros'
      });
      console.log('Coluna category adicionada à tabela announcements');

      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a migração:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove a coluna category da tabela announcements
      await queryInterface.removeColumn('announcements', 'category');
      console.log('Coluna category removida da tabela announcements');

      // Remove o tipo ENUM
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_announcements_category";`
      );
      console.log('Tipo ENUM para categoria removido');

      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a reversão da migração:', error);
      return Promise.reject(error);
    }
  }
};
