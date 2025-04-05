'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar o tipo atual da coluna location
      const tableDefinition = await queryInterface.describeTable('announcements');
      
      if (tableDefinition.location) {
        console.log('Coluna location existe na tabela announcements');
        console.log('Tipo atual:', tableDefinition.location.type);
        
        // Alterar o tipo da coluna location para STRING
        await queryInterface.changeColumn('announcements', 'location', {
          type: Sequelize.STRING,
          allowNull: false
        });
        
        console.log('Tipo da coluna location alterado para STRING');
      } else {
        console.log('Coluna location não existe na tabela announcements');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a migração:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Não fazemos nada no down, pois não queremos reverter essa alteração
      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a reversão da migração:', error);
      return Promise.reject(error);
    }
  }
};
