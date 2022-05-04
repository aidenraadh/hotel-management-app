'use strict';

const model       = require('../../models/index')
const Owner       = model.Owner
const RoomService = model.RoomService
const Room        = model.Room

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const owner = await Owner.findOne()
    const roomServices = [
      {
        name: 'Hot towel', 
        owner_id: owner.id, 
        price_based_id: 1
      }
    ]

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
