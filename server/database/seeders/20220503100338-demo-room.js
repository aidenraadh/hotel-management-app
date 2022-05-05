'use strict';

const model    = require('../../models/index')
const Hotel    = model.Hotel
const RoomType = model.RoomType
const Room     = model.Room

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hotel = await Hotel.findOne()
    const roomType = await RoomType.findOne({
      where: {hotel_id: hotel.id}
    })
    const rooms = [
      {
        name: '1', hotel_id: hotel.id, room_type_id: roomType.id,
        pricing_type_id: 1
      }
    ]

    await Room.bulkCreate(rooms)
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
