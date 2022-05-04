'use strict';

const model     = require('./../../models/index')
const Owner     = model.Owner
const GuestType = model.GuestType

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const owner = await Owner.findOne()

    const guestTypes = [
      {
        name: 'Regular', owner_id: owner.id, room_price: 100000,
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
