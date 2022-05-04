'use strict';

const model    = require('../../models/index')
const Owner    = model.Owner
const RoomType = model.RoomType

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const owner = await Owner.findOne()

    const roomTypes = [
      {
        name: 'VIP', owner_id: owner.id, room_price: 120000,
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
