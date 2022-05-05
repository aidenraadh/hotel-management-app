'use strict';

const {Op}   = require("sequelize")
const models = require('../../models/index')
const Role   = models.Role
const Hotel  = models.Hotel
const bcrypt = require('bcrypt')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const currentTime = new Date()
    // Get the first hotel
    const hotel = await Hotel.findOne({attributes: ['id']})

    // Get the hotel role
    const adminRole = await Role.findOne({
      where: {name: {[Op.iLike]: `admin`}},
      attributes: ['id']
    })

    // Get the employee role
    const employeeRole = await Role.findOne({
      where: {name: {[Op.iLike]: `employee`}},
      attributes: ['id']
    })

    const users = [
      {
        name: 'Admin 1', email: 'admin1@gmail.com',
        password: await bcrypt.hash('12345678', 10),
        role_id: adminRole.id, hotel_id: hotel.id,
        language_id: 1,
        created_at: currentTime,
        updated_at: currentTime          
      },    
      {
        name: 'Employee 1', email: 'employee1@gmail.com',
        password: await bcrypt.hash('12345678', 10),
        role_id: employeeRole.id, hotel_id: hotel.id,
        language_id: 1,
        created_at: currentTime,
        updated_at: currentTime          
      },       
    ]
    await queryInterface.bulkInsert('users', users);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
