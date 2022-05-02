'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('guest_types', {
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
      owner_id: {
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
    // Add foreign key to owner_id
    await queryInterface.addConstraint('guest_types', {
      fields: ['owner_id'],
      type: 'foreign key',
      name: 'fk_guest_types_owner_id',
      references: {
        table: 'owners',
        field: 'id',
      }
    })     
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('guest_types', 'fk_guest_types_owner_id');
    await queryInterface.dropTable('guest_types');
  }
};