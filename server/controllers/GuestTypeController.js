const Sequelize             = require("sequelize")
const {Op}                  = require("sequelize")
const Joi                   = require('joi')
const filterKeys            = require('../utils/filterKeys')
const logger                = require('../utils/logger')
const RoomPricingController = require('../controllers/RoomPricingController.js')
const model                 = require('../models/index')
const GuestType             = model.GuestType

exports.index = async (req, res) => {    
    try {
        // Get only the room type and its specific columns
        if(req.query.get){
            const guestTypes = await GuestType.findAll({
                where: {hotel_id: req.user.hotel_id},
                attributes: req.query.get.split(',')
            })
            return res.send({guestTypes: guestTypes})
        }          
        // Sanitized the queries
        const queries = {...req.query}
        queries.limit = parseInt(queries.limit) ? parseInt(queries.limit) : 10
        queries.offset = parseInt(queries.offset) ? parseInt(queries.offset) : 0  
        queries.name = Joi.string().required().trim().validate(queries.name)
        queries.name = queries.name.error ? '' : queries.name.value        
        // Set filters default values
        const filters = {
            where: {hotel_id: req.user.hotel_id},
            limitOffset: {limit: queries.limit, offset: queries.offset}
        }
        if(queries.name){
            filters.where.name = {[Op.iLike]: `%${queries.name}%`}
        } 
        const guestTypes = await GuestType.findAll({
            attributes: ['id', 'name'],
            where: filters.where,
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
        res.send({
            guestTypes: guestTypes,
            filters: queries
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.store = async (req, res) => {
    try {
        const {values, errMsg} = await validateInput(req, ['name'])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        const guestType = await GuestType.create({
            name: values.name, hotel_id: req.user.hotel_id,
        })
        res.send({
            guestType: guestType,
            message: 'Guest type successfully created'
        })        
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}

exports.update = async (req, res) => {
    try {
        const guestType = await getGuestType(req.params.id, req.user.hotel_id)
        if(!guestType){
            return res.status(400).send({message: 'Guest type not found'})
        }
        const {values, errMsg} = await validateInput(req, ['name'])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        guestType.name = values.name
        
        await guestType.save()    
    
        res.send({
            guestType: guestType,
            message: 'Guest type successfully updated'
        }) 
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})             
    }   
}

exports.destroy = async (req, res) => {
    try {
        const guestType = await getGuestType(req.params.id, req.user.hotel_id)
        if(!guestType){
            return res.status(400).send({message: 'Guest type not found'})
        }
        // Delete the guest type
        await guestType.destroy()
        // Destroy the room pricings for this guest type
        await RoomPricingController.destroyRoomPricings(guestType.id, GuestType)
    
        res.send({
            message: 'Guest type successfully deleted'
        }) 
    } catch (err) {
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
            // Make sure the guest type name is unique by hotel
            name: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const filters = [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), Sequelize.fn('lower', value)),
                    {hotel_id: req.user.hotel_id}                    
                ]
                // When the guest type is updated
                if(req.params.id){
                    filters.push({[Op.not]: [{id: req.params.id}]})                    
                }
                const guestType = await GuestType.findOne({where: filters, attributes: ['id']})

                if(guestType){
                    throw {message: 'The guest type name already taken'}
                }
                return value
            }).messages({
                'string.max': 'The guest type name must below 100 characters',
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

/**
 * 
 * @param {integer} id 
 * @param {integer} hotelId 
 * @returns object
 */

const getGuestType = async (id, hotelId) => {
    try {
        return await GuestType.findOne({where: {
            id: id, hotel_id: hotelId
        }})
    } catch (error) {
        throw error
    }
}