'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('room_services', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      owner_id: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
      },                    
      price_based_on: {
        type: Sequelize.DataTypes.SMALLINT,
        allowNull: false,
      },       
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      } 
    });
    // Add foreign key to owner_id
    await queryInterface.addConstraint('room_services', {
      fields: ['owner_id'],
      type: 'foreign key',
      name: 'fk_room_services_owner_id',
      references: {
        table: 'owners',
        field: 'id',
      }
    })     
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('room_services', 'fk_room_services_owner_id');
    await queryInterface.dropTable('room_services');
  }
};