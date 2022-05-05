'use strict';

const model    = require('../../models/index')
const Hotel    = model.Hotel
const RoomType = model.RoomType

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hotel = await Hotel.findOne()

    const roomTypes = [
      {
        name: 'VIP', hotel_id: hotel.id, room_price: 120000,
      }
    ]

    await RoomType.bulkCreate(roomTypes)
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
