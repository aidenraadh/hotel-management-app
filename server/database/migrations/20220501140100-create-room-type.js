'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('room_types', {
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
      hotel_id: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
      },   
      room_price: {
        type: Sequelize.DataTypes.INTEGER,
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
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      }  
    });
    // Add foreign key to hotel_id
    await queryInterface.addConstraint('room_types', {
      fields: ['hotel_id'],
      type: 'foreign key',
      name: 'fk_room_types_hotel_id',
      references: {
        table: 'hotels',
        field: 'id',
      }
    })     
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('room_types', 'fk_room_types_hotel_id');
    await queryInterface.dropTable('room_types');
  }
};