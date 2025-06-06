'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Primeiro, vamos verificar se a coluna status existe na tabela offers
      try {
        const tableDefinition = await queryInterface.describeTable('offers');
        if (tableDefinition.status) {
          console.log('Coluna status existe na tabela offers');
          
          // Remover a restrição de chave estrangeira temporariamente
          await queryInterface.sequelize.query(
            `ALTER TABLE "offers" ALTER COLUMN "status" DROP DEFAULT;`
          );
          
          // Remover a coluna status temporariamente
          await queryInterface.sequelize.query(
            `ALTER TABLE "offers" DROP COLUMN "status";`
          );
          console.log('Coluna status removida temporariamente');
          
          // Remover o tipo ENUM existente
          await queryInterface.sequelize.query(
            `DROP TYPE IF EXISTS "enum_offers_status";`
          );
          console.log('Tipo ENUM para status removido');
          
          // Criar o tipo ENUM novamente com todos os valores necessários
          await queryInterface.sequelize.query(
            `CREATE TYPE "enum_offers_status" AS ENUM ('pending', 'accepted', 'rejected', 'completed');`
          );
          console.log('Tipo ENUM para status recriado com todos os valores');
          
          // Adicionar a coluna status novamente
          await queryInterface.addColumn('offers', 'status', {
            type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'completed'),
            allowNull: false,
            defaultValue: 'pending'
          });
          console.log('Coluna status adicionada novamente com o tipo ENUM atualizado');
        } else {
          console.log('Coluna status não existe na tabela offers');
          
          // Criar o tipo ENUM
          await queryInterface.sequelize.query(
            `CREATE TYPE "enum_offers_status" AS ENUM ('pending', 'accepted', 'rejected', 'completed');`
          );
          console.log('Tipo ENUM para status criado');
          
          // Adicionar a coluna status
          await queryInterface.addColumn('offers', 'status', {
            type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'completed'),
            allowNull: false,
            defaultValue: 'pending'
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
