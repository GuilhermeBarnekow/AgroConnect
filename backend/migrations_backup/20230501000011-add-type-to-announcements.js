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

      // Verificar se a coluna type já existe
      const columnExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'announcements' 
          AND column_name = 'type'
        );`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (columnExists[0].exists) {
        console.log('Coluna type já existe na tabela announcements');
        
        // Verificar os valores válidos para o ENUM
        const enumValues = await queryInterface.sequelize.query(
          `SELECT unnest(enum_range(NULL::enum_announcements_type)) as value;`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        console.log('Valores válidos para o ENUM type:', enumValues);
        
        // Usar o primeiro valor do ENUM para atualizar valores nulos
        if (enumValues.length > 0) {
          const firstEnumValue = enumValues[0].value;
          console.log('Usando o valor ENUM:', firstEnumValue);
          
          await queryInterface.sequelize.query(
            `UPDATE announcements SET type = '${firstEnumValue}' WHERE type IS NULL;`
          );
        }
        
        // Alterar a coluna para não permitir valores nulos
        await queryInterface.sequelize.query(
          `ALTER TABLE announcements ALTER COLUMN type SET NOT NULL;`
        );
        
        return Promise.resolve();
      }

      // Adicionar a coluna type
      await queryInterface.addColumn('announcements', 'type', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'default',
      });

      console.log('Coluna type adicionada à tabela announcements');
      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a migração:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remover a coluna type
      await queryInterface.removeColumn('announcements', 'type');
      console.log('Coluna type removida da tabela announcements');
      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a reversão da migração:', error);
      return Promise.reject(error);
    }
  }
};
