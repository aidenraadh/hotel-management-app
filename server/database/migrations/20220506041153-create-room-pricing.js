'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('room_pricings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      room_type_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      guest_type_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      price_on_monday: {
        type: Sequelize.INTEGER,
        allowNull: true,        
      },  
      price_on_tuesday: {
        type: Sequelize.INTEGER,
        allowNull: true,        
      },  
      price_on_wednesday: {
        type: Sequelize.INTEGER,
        allowNull: true,        
      },  
      price_on_thursday: {
        type: Sequelize.INTEGER,
        allowNull: true,        
      },  
      price_on_friday: {
        type: Sequelize.INTEGER,
        allowNull: true,        
      },        
      price_on_saturday: {
        type: Sequelize.INTEGER,
        allowNull: true,        
      },  
      price_on_sunday: {
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
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      }      
    });
    // Add foreign key to room_type_id
    await queryInterface.addConstraint('room_pricings', {
      fields: ['room_type_id'],
      type: 'foreign key',
      name: 'fk_room_pricings_room_type_id',
      references: {
        table: 'room_types',
        field: 'id',
      }
    })    
    // Add foreign key to guest_type_id
    await queryInterface.addConstraint('room_pricings', {
      fields: ['guest_type_id'],
      type: 'foreign key',
      name: 'fk_room_pricings_guest_type_id',
      references: {
        table: 'guest_types',
        field: 'id',
      }
    })        
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('room_pricings', 'fk_room_pricings_room_type_id');
    await queryInterface.removeConstraint('room_pricings', 'fk_room_pricings_guest_type_id');
    await queryInterface.dropTable('room_pricings');
  }
};