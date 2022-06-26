'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('room_type_room_services', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      room_service_id: {
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
      }
    });
    // Add foreign key to room_service_id
    await queryInterface.addConstraint('room_type_room_services', {
      fields: ['room_service_id'],
      type: 'foreign key',
      name: 'fk_room_type_room_services_room_service_id',
      references: {
        table: 'room_services',
        field: 'id',
      }
    }) 
    // Add foreign key to room_type_id
    await queryInterface.addConstraint('room_type_room_services', {
      fields: ['room_type_id'],
      type: 'foreign key',
      name: 'fk_room_type_room_services_room_type_id',
      references: {
        table: 'room_types',
        field: 'id',
      }
    })     
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('room_type_room_services', 'fk_room_type_room_services_room_service_id');
    await queryInterface.removeConstraint('room_type_room_services', 'fk_room_type_room_services_room_type_id');    
    await queryInterface.dropTable('room_type_room_services');
  }
};