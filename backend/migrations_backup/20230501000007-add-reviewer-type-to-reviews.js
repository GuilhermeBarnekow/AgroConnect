'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar se a coluna já existe
      const tableDefinition = await queryInterface.describeTable('reviews');
      
      if (!tableDefinition.reviewer_type) {
        console.log('Adicionando coluna reviewer_type à tabela reviews');
        
        // Criar o tipo ENUM para reviewer_type
        await queryInterface.sequelize.query(
          `CREATE TYPE "enum_reviews_reviewer_type" AS ENUM ('buyer', 'seller');`
        );
        
        // Adicionar a coluna reviewer_type
        await queryInterface.addColumn('reviews', 'reviewer_type', {
          type: Sequelize.ENUM('buyer', 'seller'),
          allowNull: false,
          defaultValue: 'buyer'
        });
        
        console.log('Coluna reviewer_type adicionada com sucesso');
      } else {
        console.log('Coluna reviewer_type já existe na tabela reviews');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a migração:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remover a coluna reviewer_type
      await queryInterface.removeColumn('reviews', 'reviewer_type');
      
      // Remover o tipo ENUM
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_reviews_reviewer_type";`
      );
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a reversão da migração:', error);
      return Promise.reject(error);
    }
  }
};
