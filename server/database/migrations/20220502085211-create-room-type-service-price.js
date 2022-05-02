'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('room_type_service_prices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      room_service_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      room_type_id: {
        type: Sequelize.BIGINT,
        allowNull: false,        
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: true,         
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
    });
    // Add foreign key to room_type_id
    await queryInterface.addConstraint('room_type_service_prices', {
      fields: ['room_type_id'],
      type: 'foreign key',
      name: 'fk_room_type_service_prices_room_type_id',
      references: {
        table: 'room_types',
        field: 'id',
      }
    });
    // Add foreign key to room_service_id
    await queryInterface.addConstraint('room_type_service_prices', {
      fields: ['room_service_id'],
      type: 'foreign key',
      name: 'fk_room_type_service_prices_room_service_id',
      references: {
        table: 'room_services',
        field: 'id',
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('room_type_service_prices', 'fk_room_type_service_prices_room_type_id');
    await queryInterface.removeConstraint('room_type_service_prices', 'fk_room_type_service_prices_room_service_id');
    await queryInterface.dropTable('room_type_service_prices');
  }
};