'use strict';

const model       = require('../../models/index')
const Hotel       = model.Hotel
const RoomType    = model.RoomType
const GuestType   = model.GuestType
const RoomPricing = model.RoomPricing

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hotel = await Hotel.findOne()
    const roomType = await RoomType.findOne({where: {
      hotel_id: hotel.id
    }})
    const guestType = await GuestType.findOne({where: {
      hotel_id: hotel.id
    }})

    const roomPricings = [
      {
        room_type_id: roomType.id, guest_type_id: guestType.id,
        price_on_monday: 100000, price_on_tuesday: 100000, price_on_wednesday: 100000,
        price_on_thursday: 100000, price_on_friday: 100000, price_on_saturday: 100000,
        price_on_sunday: 100000,
      }
    ]
    RoomPricing.bulkCreate(roomPricings)
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
