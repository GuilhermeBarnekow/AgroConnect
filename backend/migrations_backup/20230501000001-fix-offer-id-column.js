'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verifica se a coluna offer_id já existe na tabela reviews
      try {
        const tableDefinition = await queryInterface.describeTable('reviews');
        
        // Se a coluna já existe, não faz nada
        if (tableDefinition.offer_id) {
          console.log('Coluna offer_id já existe na tabela reviews');
          return Promise.resolve();
        }
        
        // Adiciona offer_id à tabela reviews com o tipo UUID
        await queryInterface.addColumn('reviews', 'offer_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'offers',
            key: 'id'
          }
        });
        console.log('Coluna offer_id (UUID) adicionada à tabela reviews');
        
        return Promise.resolve();
      } catch (error) {
        console.error('Erro ao verificar ou adicionar a coluna offer_id:', error);
        return Promise.reject(error);
      }
    } catch (error) {
      console.error('Erro durante a migração:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove a coluna offer_id da tabela reviews
      await queryInterface.removeColumn('reviews', 'offer_id');
      console.log('Coluna offer_id removida da tabela reviews');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a reversão da migração:', error);
      return Promise.reject(error);
    }
  }
};
