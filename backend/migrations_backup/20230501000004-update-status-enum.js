'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Primeiro, vamos verificar se a coluna status existe
      try {
        const tableDefinition = await queryInterface.describeTable('announcements');
        if (tableDefinition.status) {
          console.log('Coluna status existe na tabela announcements');
          
          // Remover a restrição de chave estrangeira temporariamente
          await queryInterface.sequelize.query(
            `ALTER TABLE "announcements" ALTER COLUMN "status" DROP DEFAULT;`
          );
          
          // Remover a coluna status temporariamente
          await queryInterface.sequelize.query(
            `ALTER TABLE "announcements" DROP COLUMN "status";`
          );
          console.log('Coluna status removida temporariamente');
          
          // Remover o tipo ENUM existente
          await queryInterface.sequelize.query(
            `DROP TYPE IF EXISTS "enum_announcements_status";`
          );
          console.log('Tipo ENUM para status removido');
          
          // Criar o tipo ENUM novamente com todos os valores necessários
          await queryInterface.sequelize.query(
            `CREATE TYPE "enum_announcements_status" AS ENUM ('active', 'pending', 'completed', 'cancelled');`
          );
          console.log('Tipo ENUM para status recriado com todos os valores');
          
          // Adicionar a coluna status novamente
          await queryInterface.addColumn('announcements', 'status', {
            type: Sequelize.ENUM('active', 'pending', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'active'
          });
          console.log('Coluna status adicionada novamente com o tipo ENUM atualizado');
        } else {
          console.log('Coluna status não existe na tabela announcements');
          
          // Criar o tipo ENUM
          await queryInterface.sequelize.query(
            `CREATE TYPE "enum_announcements_status" AS ENUM ('active', 'pending', 'completed', 'cancelled');`
          );
          console.log('Tipo ENUM para status criado');
          
          // Adicionar a coluna status
          await queryInterface.addColumn('announcements', 'status', {
            type: Sequelize.ENUM('active', 'pending', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'active'
          });
          console.log('Coluna status adicionada com o tipo ENUM correto');
        }
      } catch (error) {
        console.error('Erro ao verificar ou atualizar a coluna status:', error);
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
