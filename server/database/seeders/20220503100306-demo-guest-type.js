'use strict';

const model     = require('./../../models/index')
const Hotel     = model.Hotel
const GuestType = model.GuestType

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hotel = await Hotel.findOne()

    const guestTypes = [
      {
        name: 'Regular', hotel_id: hotel.id
      }
    ]

    await GuestType.bulkCreate(guestTypes)
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
