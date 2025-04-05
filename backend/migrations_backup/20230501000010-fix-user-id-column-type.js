'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar o tipo atual da coluna user_id na tabela announcements
      const result = await queryInterface.sequelize.query(
        `SELECT data_type 
         FROM information_schema.columns 
         WHERE table_name = 'announcements' 
         AND column_name = 'user_id';`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (result.length > 0) {
        const currentType = result[0].data_type;
        console.log(`Tipo atual da coluna user_id: ${currentType}`);

        // Se o tipo atual for integer, alterar para uuid
        if (currentType === 'integer') {
          console.log('Alterando tipo da coluna user_id de integer para uuid');
          await queryInterface.sequelize.query(
            `ALTER TABLE announcements 
             ALTER COLUMN user_id TYPE uuid USING user_id::text::uuid;`
          );
        }
      }

      // Verificar o tipo atual da coluna id na tabela users
      const userResult = await queryInterface.sequelize.query(
        `SELECT data_type 
         FROM information_schema.columns 
         WHERE table_name = 'users' 
         AND column_name = 'id';`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (userResult.length > 0) {
        const userIdType = userResult[0].data_type;
        console.log(`Tipo atual da coluna id na tabela users: ${userIdType}`);

        // Se o tipo for uuid, atualizar o modelo User para usar UUID
        if (userIdType === 'uuid') {
          console.log('O tipo da coluna id na tabela users é uuid');
        }
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
