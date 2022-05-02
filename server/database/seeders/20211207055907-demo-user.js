'use strict';

const {Op}   = require("sequelize")
const models = require('../../models/index')
const Role   = models.Role
const Owner  = models.Owner
const bcrypt = require('bcrypt')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const currentTime = new Date()
    // Get the first owner
    const owner = await Owner.findOne({attributes: ['id']})

    // Get the owner role
    const adminRole = await Role.findOne({
      where: {name: {[Op.iLike]: `%admin%`}},
      attributes: ['id']
    })

    // Get the employee role
    const employeeRole = await Role.findOne({
      where: {name: {[Op.iLike]: `%employee%`}},
      attributes: ['id']
    })

    const users = [
      {
        name: 'Admin 1', email: 'admin1@gmail.com',
        password: await bcrypt.hash('12345678', 10),
        role_id: adminRole.id, owner_id: owner.id,
        created_at: currentTime,
        updated_at: currentTime          
      },    
      {
        name: 'Employee 1', email: 'employee1@gmail.com',
        password: await bcrypt.hash('12345678', 10),
        role_id: employeeRole.id, owner_id: owner.id,
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
