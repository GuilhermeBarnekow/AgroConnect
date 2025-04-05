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

      // Adiciona a coluna accept_counter_offers à tabela announcements se não existir
      if (!(await columnExists('announcements', 'accept_counter_offers'))) {
        await queryInterface.addColumn('announcements', 'accept_counter_offers', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        });
        console.log('Coluna accept_counter_offers adicionada à tabela announcements');
      } else {
        console.log('Coluna accept_counter_offers já existe na tabela announcements');
      }

      // Adiciona a coluna status à tabela announcements se não existir
      if (!(await columnExists('announcements', 'status'))) {
        try {
          await queryInterface.sequelize.query(
            `CREATE TYPE "enum_announcements_status" AS ENUM ('active', 'pending', 'completed', 'cancelled');`
          );
          console.log('Tipo ENUM para status criado');

          await queryInterface.addColumn('announcements', 'status', {
            type: Sequelize.ENUM('active', 'pending', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'active'
          });
          console.log('Coluna status adicionada à tabela announcements');
        } catch (error) {
          console.log('Erro ao criar tipo ENUM para status ou adicionar coluna status:', error.message);
        }
      } else {
        console.log('Coluna status já existe na tabela announcements');
      }

      // Adiciona a coluna views à tabela announcements se não existir
      if (!(await columnExists('announcements', 'views'))) {
        await queryInterface.addColumn('announcements', 'views', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        });
        console.log('Coluna views adicionada à tabela announcements');
      } else {
        console.log('Coluna views já existe na tabela announcements');
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
      if (await columnExists('announcements', 'views')) {
        await queryInterface.removeColumn('announcements', 'views');
        console.log('Coluna views removida da tabela announcements');
      }

      if (await columnExists('announcements', 'status')) {
        await queryInterface.removeColumn('announcements', 'status');
        console.log('Coluna status removida da tabela announcements');
      }

      try {
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "enum_announcements_status";`
        );
        console.log('Tipo ENUM para status removido');
      } catch (error) {
        console.log('Erro ao remover tipo ENUM para status:', error.message);
      }

      if (await columnExists('announcements', 'accept_counter_offers')) {
        await queryInterface.removeColumn('announcements', 'accept_counter_offers');
        console.log('Coluna accept_counter_offers removida da tabela announcements');
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Erro durante a reversão da migração:', error);
      return Promise.reject(error);
    }
  }
};
