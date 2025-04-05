'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Announcements', 'type', {
      type: Sequelize.ENUM('service', 'machinery'),
      allowNull: false,
      defaultValue: 'service',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Announcements', 'type');
  }
};
