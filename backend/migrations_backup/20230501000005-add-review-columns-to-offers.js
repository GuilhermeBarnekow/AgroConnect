'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Função para verificar se uma coluna existe
      const columnExists = async (tableName, columnName) => {
        try {
          const tableDefinition = await queryInterface.describeTable(tableName);
          return !!tableDefinition[columnName];
        } catch (error) {
          return false;
        }
      };

      // Adiciona a coluna buyer_reviewed à tabela offers se não existir
      if (!(await columnExists('offers', 'buyer_reviewed'))) {
        await queryInterface.addColumn('offers', 'buyer_reviewed', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        console.log('Coluna buyer_reviewed adicionada à tabela offers');
      } else {
        console.log('Coluna buyer_reviewed já existe na tabela offers');
      }

      // Adiciona a coluna seller_reviewed à tabela offers se não existir
      if (!(await columnExists('offers', 'seller_reviewed'))) {
        await queryInterface.addColumn('offers', 'seller_reviewed', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        console.log('Coluna seller_reviewed adicionada à tabela offers');
      } else {
        console.log('Coluna seller_reviewed já existe na tabela offers');
      }

      // Verifica se a coluna status existe e se é do tipo ENUM
      if (await columnExists('offers', 'status')) {
        try {
          // Verifica se o tipo ENUM para status já existe
          await queryInterface.sequelize.query(
            `SELECT 1 FROM pg_type WHERE typname = 'enum_offers_status';`
          );
          console.log('Tipo ENUM para status já existe');
        } catch (error) {
          // Cria o tipo ENUM para status
          try {
            await queryInterface.sequelize.query(
              `CREATE TYPE "enum_offers_status" AS ENUM ('pending', 'accepted', 'rejected', 'completed');`
            );
            console.log('Tipo ENUM para status criado');
          } catch (error) {
            console.log('Erro ao criar tipo ENUM para status:', error.message);
          }
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
      // Função para verificar se uma coluna existe
      const columnExists = async (tableName, columnName) => {
        try {
          const tableDefinition = await queryInterface.describeTable(tableName);
          return !!tableDefinition[columnName];
        } catch (error) {
          return false;
        }
      };

      // Remove as colunas na ordem inversa, se existirem
      if (await columnExists('offers', 'seller_reviewed')) {
        await queryInterface.removeColumn('offers', 'seller_reviewed');
        console.log('Coluna seller_reviewed removida da tabela offers');
      }

      if (await columnExists('offers', 'buyer_reviewed')) {
        await queryInterface.removeColumn('offers', 'buyer_reviewed');
        console.log('Coluna buyer_reviewed removida da tabela offers');
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a reversão da migração:', error);
      return Promise.reject(error);
    }
  }
};
