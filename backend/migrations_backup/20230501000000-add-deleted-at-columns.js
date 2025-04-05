'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Adiciona deleted_at à tabela announcements
      await queryInterface.addColumn('announcements', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('Coluna deleted_at adicionada à tabela announcements');
      
      // Adiciona deleted_at à tabela offers
      await queryInterface.addColumn('offers', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('Coluna deleted_at adicionada à tabela offers');
      
      // Adiciona deleted_at à tabela reviews
      await queryInterface.addColumn('reviews', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('Coluna deleted_at adicionada à tabela reviews');
      
      // Verifica se a coluna offer_id já existe na tabela reviews
      try {
        await queryInterface.describeTable('reviews').then(tableDefinition => {
          if (!tableDefinition.offer_id) {
            // Adiciona offer_id à tabela reviews se estiver faltando
            return queryInterface.addColumn('reviews', 'offer_id', {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: {
                model: 'offers',
                key: 'id'
              }
            }).then(() => {
              console.log('Coluna offer_id adicionada à tabela reviews');
            });
          } else {
            console.log('Coluna offer_id já existe na tabela reviews');
          }
        });
      } catch (error) {
        console.error('Erro ao verificar ou adicionar a coluna offer_id:', error);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a migração:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove as colunas na ordem inversa
      await queryInterface.removeColumn('reviews', 'offer_id');
      console.log('Coluna offer_id removida da tabela reviews');
      
      await queryInterface.removeColumn('reviews', 'deleted_at');
      console.log('Coluna deleted_at removida da tabela reviews');
      
      await queryInterface.removeColumn('offers', 'deleted_at');
      console.log('Coluna deleted_at removida da tabela offers');
      
      await queryInterface.removeColumn('announcements', 'deleted_at');
      console.log('Coluna deleted_at removida da tabela announcements');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a reversão da migração:', error);
      return Promise.reject(error);
    }
  }
};
