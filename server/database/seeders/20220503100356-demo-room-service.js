'use strict';

const model       = require('../../models/index')
const Hotel       = model.Hotel
const RoomService = model.RoomService

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hotel = await Hotel.findOne()
    const roomServices = [
      {
        name: 'Hot towel', 
        hotel_id: hotel.id, 
      }
    ]
    await RoomService.bulkCreate(roomServices)
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
