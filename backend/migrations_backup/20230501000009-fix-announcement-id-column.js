'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar se a tabela announcements existe
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'announcements'
        );`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!tableExists[0].exists) {
        console.log('Tabela announcements não existe');
        return Promise.resolve();
      }

      // Verificar se a coluna id existe
      const columnExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'announcements' 
          AND column_name = 'id'
        );`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!columnExists[0].exists) {
        console.log('Coluna id não existe na tabela announcements');
        return Promise.resolve();
      }

      // Verificar o tipo atual da coluna id
      const idTypeResult = await queryInterface.sequelize.query(
        `SELECT data_type 
         FROM information_schema.columns 
         WHERE table_name = 'announcements' 
         AND column_name = 'id';`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (idTypeResult.length > 0) {
        const idType = idTypeResult[0].data_type;
        console.log(`Tipo atual da coluna id: ${idType}`);

        // Se o tipo for uuid, definir um valor padrão de uuid
        if (idType === 'uuid') {
          console.log('Alterando coluna id para usar uuid_generate_v4()');
          
          // Verificar se a extensão uuid-ossp está instalada
          await queryInterface.sequelize.query(
            `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
          );
          
          // Alterar a coluna id para usar uuid_generate_v4()
          await queryInterface.sequelize.query(
            `ALTER TABLE announcements 
             ALTER COLUMN id SET DEFAULT uuid_generate_v4();`
          );
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
