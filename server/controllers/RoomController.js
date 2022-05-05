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
        // Set filters
        const filters = {
            where: {},
            limitOffset: {
                limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10,
                offset: parseInt(req.query.offset) ? parseInt(req.query.offset) : 0                
            }
        }
        if(req.query.name){
            const {value, error} = Joi.string().required().trim().validate(req.query.name)
            if(error === undefined){ filters.where.name = value }
        }
        const rooms = await Room.findAll({
            attributes: ['id', 'name', 'pricing_type_id'],
            where: (() => {
                const where = {...filters.where, hotel_id: req.user.hotel_id}
                if(where.name){ where.name =  {[Op.iLike]: `%${where.name}%`}}
                return where
            })(),
            include: [
                {
                    model: RoomType, as: 'roomType', attributes: ['id', 'name']
                }
            ],
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
        res.send({
            rooms: rooms,
            filters: {...filters.where, ...filters.limitOffset}
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.store = async (req, res) => {
    try {
        const {values, errMsg} = await validateInput(req, [
            'name', 'roomTypeId', 'pricingTypeId'
        ])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        const roomType = await GuestType.create({
            name: values.name, 
            room_type_id: values.roomTypeId, 
            pricing_type_id: values.pricingTypeId, 
            hotel_id: req.user.hotel_id,
        })
        res.send({
            roomType: roomType,
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
            return res.status(400).send({message: 'Guest type not found'})
        }
        const {values, errMsg} = await validateInput(req, [
            'name', 'roomTypeId', 'pricingTypeId'
        ])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        room.name = values.name
        room.room_type_id = values.roomTypeId
        room.pricing_type_id = values.pricingTypeId
    
        await room.save()    
    
        res.send({
            room: room,
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
            return res.status(400).send({message: 'Guest type not found'})
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
            pricingTypeId: Joi.number().required().integer().external(async (value) => {
                // Check if the pricing type exists
                const pricingTypeIds = Object.keys(Room.getPricingTypes()).map(id => parseInt(id))
                if(!pricingTypeIds.includes(value)){
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
        return await Room.findOne({where: {
            id: id, hotel_id: hotelId
        }})
    } catch (error) {
        throw error
    }
}