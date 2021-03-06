const model      = require('../models/index')
const Room       = model.Room
const RoomType   = model.RoomType
const Sequelize  = require("sequelize")
const {Op}       = require("sequelize")
const Joi        = require('joi')
const filterKeys = require('../utils/filterKeys')
const logger     = require('../utils/logger')

exports.index = async (req, res) => {    
    try {
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
        // Get the rooms
        const rooms = await Room.findAll({
            attributes: ['id', 'name'],
            where: filters.where,
            include: [
                {
                    model: RoomType, as: 'roomType', attributes: ['id', 'name']
                }
            ],
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
        // Get the room types
        const roomTypes = await RoomType.findAll({
            attributes: ['id', 'name']
        })
        res.send({
            rooms: rooms,
            roomTypes: roomTypes,
            filters: queries
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.store = async (req, res) => {
    try {
        const {values, errMsg} = await validateInput(req, [
            'name', 'roomTypeId'
        ])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        const room = await Room.create({
            name: values.name, 
            room_type_id: values.roomTypeId, 
            hotel_id: req.user.hotel_id,
        })
        res.send({
            room: await getRoom(room.id, room.hotel_id),
            message: 'Room successfully created'
        })        
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}

exports.update = async (req, res) => {
    try {
        const room = await getRoom(req.params.id, req.user.hotel_id)
        if(!room){
            return res.status(400).send({message: 'Room not found'})
        }
        const {values, errMsg} = await validateInput(req, [
            'name', 'roomTypeId'
        ])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        room.name = values.name
        room.room_type_id = values.roomTypeId
    
        await room.save()    
        res.send({
            room: await getRoom(req.params.id, req.user.hotel_id),
            message: 'Room successfully updated'
        }) 
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})             
    }   
}

exports.destroy = async (req, res) => {
    try {
        const room = await getRoom(req.params.id, req.user.hotel_id)
        if(!room){
            return res.status(400).send({message: 'Room not found'})
        }
        await room.destroy()
    
        res.send({
            message: 'Room successfully deleted'
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
            // Make sure the roomtype name is unique by hotel
            name: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const filters = [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), Sequelize.fn('lower', value)),
                    {hotel_id: req.user.hotel_id}                    
                ]
                // When the room is updated
                if(req.params.id){
                    filters.push({[Op.not]: [{id: req.params.id}]})                    
                }
                const room = await Room.findOne({where: filters, attributes: ['id']})

                if(room){
                    throw {message: 'The room name already taken'}
                }
                return value
            }).messages({
                'string.max': 'The room name must below 100 characters',
            }),

            roomTypeId: Joi.number().required().integer().external(async (value) => {
                // Check if the room type exists
                const roomType = await RoomType.findOne({where: {
                    id: value, hotel_id: req.user.hotel_id
                }})
                if(!roomType){
                    throw {message: "The room type doesn't exist"}
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

/**
 * 
 * @param {integer} id 
 * @param {integer} hotelId 
 * @returns object
 */

const getRoom = async (id, hotelId) => {
    try {
        return await Room.findOne({
            where: {id: id, hotel_id: hotelId},
            attributes: ['id', 'name'],
            include: [
                {
                    model: RoomType, as: 'roomType', attributes: ['id', 'name']
                }
            ],
        })
    } catch (error) {
        throw error
    }
}