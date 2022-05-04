const bcrypt        = require('bcrypt') 
const {Op}          = require("sequelize")
const Joi           = require('joi')
const filterKeys    = require('../utils/filterKeys')
const logger        = require('../utils/logger')
const models        = require('../models/index')
const User          = models.User
const Role          = models.Role


exports.index = async (req, res) => {    
    try{
        // Set filters
        const filters = {
            where: {},
            limitOffset: {
                limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
                offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0                
            }
        }
        // Make sure the user's role exists
        let role = null
        const {value, error} = Joi.string().required().validate(req.query.role)
        if(error === undefined){
            role = await Role.findOne({
                where: {name: {[Op.iLike]: `%${value}%`}},
                attributes: ['id']
            })
        }
        // Get the users by role
        const users = await User.findAll({
            where: {role_id: role ? role.id : 0, owner_id: req.user.owner_id},
            include: (() => {
                let include = [
                    // Get the user's role
                    {
                        model: Role, as: 'role',  attributes: ['name'],
                    }, 
                ]
                // Get the user's store employee if the queried user is employee
                if(req.query.role === 'employee'){
                    include.push({
                        model: StoreEmployee, as: 'storeEmployee', 
                        attributes: ['user_id', 'store_id'],
                        include: [{
                            model: Store, as: 'store', 
                            attributes: ['name'],
                        }]
                    })
                }
                return include
            })(),
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
       
        res.send({
            users: users,
            filters: {...filters.where, ...filters.limitOffset}
        })
    }
    catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.getUserRoles = async (req, res) => {    
    try{
        // Get all roles
        const roles = await Role.findAll({
            where: {id: {[Op.not]: 1}},
            attributes: ['id', 'name'],
        }) 
        res.send({
            roles: roles,
        })
    }
    catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.updateProfile = async (req, res) => {    
    try{
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['name', 'oldPassword', 'newPassword']) 
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Update the profile
        const data = {name: values.name}
        if(values.newPassword !== ''){ data.password = values.newPassword }
        await User.update(data, {where: {id: req.user.id}})
        // Get the new profile
        const user = await User.findOne({
            where: {id: req.user.id},
            include: [
                // Get the user's role
                {
                    model: Role, as: 'role',  attributes: ['name'],
                }, 
            ]

        })      
        res.send({
            user: user,
            message: 'Profile successfully updated'
        })        
    }
    catch(err){
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

/**
 * 
 * @param {object} req - The request body
 * @param {object} input - Key-value pair of the user input
 * @returns {object} - Validated and sanitized input with error message
 */

 const validateInput = async (req, inputKeys) => {
    try {
        const input = filterKeys(req.body, inputKeys)
        const rules = {
            // Make sure the original user's role exists
            role: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const role = await Role.findOne({
                    where: {name: {[Op.iLike]: `%${value}%`}},
                    attributes: ['id', 'name']
                })
                if(!role){
                    throw {message: 'The role does not exist'}
                }
                return role
            }),            
            // Validate the user's name
            name: Joi.string().required().trim().max(100).messages({
                'string.max': "The user's name must below 100 characters",
            }),       
            // Make sure the user's email is unique
            email: Joi.string().required().trim().email().external(async (value, helpers) => {
                const user = await User.findOne({
                    where: {email: {[Op.iLike]: `%${value}%`}}, 
                    attributes: ['id']
                })
                if(user){
                    throw {message: 'The email already taken'}
                }
                return value
            }),       
            // Make the user's old password match
            oldPassword: Joi.string().required().trim().allow('', null).external(async (value, helpers) => {
                if(value === ''){ return value }
                if(!await bcrypt.compare(value, req.user.password)){
                    throw {message: "The old password doesn't match"}
                }                
                return value
            }),     
            // Make the user's new password is different from old password
            newPassword: Joi.string().required().trim().allow('', null).external(async (value, helpers) => {
                // If the password is not changed
                if(value === '' && req.body.oldPassword === ''){ return value }
                // If the password is empty but old password is not
                if(value === '' && req.body.oldPassword !== ''){
                    throw {message: "New password must be filled if the old password is filled"}
                }              
                if(value === req.body.oldPassword){
                    throw {message: "The new password must be different"}
                }                     
                const hashedNewPassword = await bcrypt.hash(
                    value, 10
                )                           
                return hashedNewPassword
            }),                         
            // Make sure the updated role ID exists
            role_id: Joi.number().required().integer().external(async (value, helpers) => {
                const role = await Role.findOne({where: {
                    id: value,
                }})
                if(!role){
                    throw {message: 'Role does not exist'}
                }
                if(value === 1){
                    throw {message: 'Cannot change role to Super Admin'}
                }
                return value
            }),                
            // Make sure the store ID exists
            store_id: Joi.number().required().integer().external(async (value, helpers) => {
                const store = await Store.findOne({where: {
                    id: value,
                    owner_id: req.user.owner_id
                }})
                if(!store){
                    throw {message: 'Store does not exist'}
                }                
                return value
            }),
        }
        // Create the schema based on the input key
        const schema = {}
        for(const key in input){
            if(rules.hasOwnProperty(key)){ schema[key] = rules[key] }
        }        
        // Validate the input
        const values = await Joi.object(schema).validateAsync(input)

        return {values: values}
    } catch (err) {
        return {errMsg: err.message}
    }    
}