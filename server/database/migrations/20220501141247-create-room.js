'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('rooms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      hotel_id: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
      },     
      room_type_id: {
        type: Sequelize.DataTypes.BIGINT,
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
    // Add foreign key to hotel_id
    await queryInterface.addConstraint('rooms', {
      fields: ['hotel_id'],
      type: 'foreign key',
      name: 'fk_rooms_hotel_id',
      references: {
        table: 'hotels',
        field: 'id',
      }
    }) 
    // Add foreign key to room_type_id
    await queryInterface.addConstraint('rooms', {
      fields: ['room_type_id'],
      type: 'foreign key',
      name: 'fk_rooms_room_type_id',
      references: {
        table: 'room_types',
        field: 'id',
      }
    })        
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('rooms', 'fk_rooms_hotel_id');
    await queryInterface.removeConstraint('rooms', 'fk_rooms_room_type_id');
    await queryInterface.dropTable('rooms');
  }
};