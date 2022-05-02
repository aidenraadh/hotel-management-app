'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('guest_type_service_prices', {
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
      guest_type_id: {
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
    // Add foreign key to guest_type_id
    await queryInterface.addConstraint('guest_type_service_prices', {
      fields: ['guest_type_id'],
      type: 'foreign key',
      name: 'guest_type_service_prices_guest_type_id',
      references: {
        table: 'guest_types',
        field: 'id',
      }
    });
    // Add foreign key to room_service_id
    await queryInterface.addConstraint('guest_type_service_prices', {
      fields: ['room_service_id'],
      type: 'foreign key',
      name: 'guest_type_service_prices_room_service_id',
      references: {
        table: 'room_services',
        field: 'id',
      }
    });    
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('guest_type_service_prices', 'guest_type_service_prices_guest_type_id');
    await queryInterface.removeConstraint('guest_type_service_prices', 'guest_type_service_prices_room_service_id');    
    await queryInterface.dropTable('guest_type_service_prices');
  }
};