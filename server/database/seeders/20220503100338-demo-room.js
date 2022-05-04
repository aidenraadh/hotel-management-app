'use strict';

const model    = require('../../models/index')
const Owner    = model.Owner
const RoomType = model.RoomType
const Room     = model.Room

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const owner = await Owner.findOne()
    const roomType = await RoomType.findOne({
      where: {owner_id: owner.id}
    })
    const rooms = [
      {
        name: '1', owner_id: owner.id, room_type_id: roomType.id,
        price_based_id: 1
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
