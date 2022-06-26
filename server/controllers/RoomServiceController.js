const model               = require('../models/index')
const RoomService         = model.RoomService
const RoomTypeRoomService = model.RoomTypeRoomService
const Sequelize           = require("sequelize")
const {Op}                = require("sequelize")
const Joi                 = require('joi')
const filterKeys          = require('../utils/filterKeys')
const logger              = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
        // Sanitized the queries
        const queries = {...req.query}
        queries.limit = parseInt(queries.limit) ? parseInt(queries.limit) : 10
        queries.offset = parseInt(queries.offset) ? parseInt(queries.offset) : 0  
        queries.name = Joi.string().required().trim().validate(queries.name)
        queries.name = queries.name.error ? '' : queries.name.value      
        queries.not_for_store = parseInt(queries.not_for_store) ? parseInt(queries.not_for_store) : ''   
        // Set filters default values
        const filters = {
            where: {hotel_id: req.user.hotel_id},
            limitOffset: {limit: queries.limit, offset: queries.offset}
        }
        if(queries.name){
            filters.where.name = {[Op.iLike]: `%${queries.name}%`}
        } 
        if(queries.not_for_store){
            filters.where = `"owner_id"=${req.user.owner_id} AND 
            NOT EXISTS (
                SELECT id FROM "${RoomTypeRoomService.tableName}" WHERE "room_service_id"="${RoomService.name}"."id"
                AND "room_type_id"=${queries.not_for_store}
            )`
            
            if(queries.name){
                filters.where = `"${RoomService.name}"."name" ILIKE '%${queries.name}%' AND `+filters.where
            }
            filters.where = Sequelize.literal(filters.where)
        }          
        // Get the rooms
        const roomServices = await RoomService.findAll({
            attributes: ['id', 'name'],
            where: filters.where,
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
        res.send({
            roomServices: roomServices,
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
        const roomService = await RoomService.create({
            name: values.name, 
            hotel_id: req.user.hotel_id,
        })
        res.send({
            roomService: roomService,
            message: 'Room service successfully created'
        })        
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}

exports.update = async (req, res) => {
    try {
        const roomService = await getRoomService(req.params.id, req.user.hotel_id)
        if(!roomService){
            return res.status(400).send({message: 'Room service not found'})
        }
        const {values, errMsg} = await validateInput(req, ['name'])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        roomService.name = values.name
    
        await roomService.save()    
        res.send({
            roomService: roomService,
            message: 'Room service successfully updated'
        }) 
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})             
    }   
}

exports.destroy = async (req, res) => {
    try {
        const roomService = await getRoomService(req.params.id, req.user.hotel_id)
        if(!roomService){
            return res.status(400).send({message: 'Room service not found'})
        }
        await roomService.destroy()
    
        res.send({
            message: 'Room service successfully deleted'
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
            // Make sure the room service name is unique by hotel
            name: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const filters = [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), Sequelize.fn('lower', value)),
                    {hotel_id: req.user.hotel_id}                    
                ]
                // When the room service is updated
                if(req.params.id){
                    filters.push({[Op.not]: [{id: req.params.id}]})                    
                }
                const roomService = await RoomService.findOne({where: filters, attributes: ['id']})

                if(roomService){
                    throw {message: 'The room name already taken'}
                }
                return value
            }).messages({
                'string.max': 'The room name must below 100 characters',
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

const getRoomService = async (id, hotelId) => {
    try {
        return await RoomService.findOne({
            where: {id: id, hotel_id: hotelId},
            attributes: ['id', 'name'],
        })
    } catch (error) {
        throw error
    }
}