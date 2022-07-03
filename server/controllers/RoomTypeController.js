const Sequelize             = require("sequelize")
const {Op}                  = require("sequelize")
const Joi                   = require('joi')
const filterKeys            = require('../utils/filterKeys')
const logger                = require('../utils/logger')
const RoomPricingController = require('../controllers/RoomPricingController.js')
const model                 = require('../models/index')
const RoomType              = model.RoomType
const RoomTypeRoomService   = model.RoomTypeRoomService
const RoomService           = model.RoomService


exports.index = async (req, res) => {    
    try {
        // Get only the room type and its specific columns
        if(req.query.get){
            const roomTypes = await RoomType.findAll({
                where: {hotel_id: req.user.hotel_id},
                attributes: req.query.get.split(',')
            })
            return res.send({roomTypes: roomTypes})
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
        const roomTypes = await RoomType.findAll({
            attributes: ['id', 'name'],
            where: filters.where,
            include: [
                {
                    model: RoomTypeRoomService, as: 'roomServiceList',
                    attributes: ['id'],
                    include: [
                        {
                            model: RoomService, as: 'roomService',
                            attributes: ['id', 'name'],                            
                        }
                    ]                    
                }
            ],
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
        res.send({
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
        const {values, errMsg} = await validateInput(req, ['name'])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        const roomType = await RoomType.create({
            name: values.name, hotel_id: req.user.hotel_id,
        })
        return res.send({
            roomType: roomType,
            message: 'Room type successfully created'
        })        
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}

exports.update = async (req, res) => {
    try {
        const roomType = await getRoomType(req.params.id, req.user.hotel_id)
        if(!roomType){
            return res.status(400).send({message: 'Room type not found'})
        }
        const {values, errMsg} = await validateInput(req, ['name'])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        roomType.name = values.name
        
        await roomType.save()    
    
        res.send({
            roomType: roomType,
            message: 'Room type successfully updated'
        })          
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})          
    }  
}

exports.destroy = async (req, res) => {
    try {
        const roomType = await getRoomType(req.params.id, req.user.hotel_id)
        if(!roomType){
            return res.status(400).send({message: 'Room type not found'})
        }
        // Destroy the room type
        await roomType.destroy()
        // Destroy the room pricings for this room type
        await RoomPricingController.destroyRoomPricings(roomType.id, RoomType)
        // Destroy the roomTypeRoomService for this room type
        await RoomTypeRoomService.destroy({where: {room_type_id: roomType.id}})
        
        res.send({
            message: 'Room type successfully deleted'
        })            
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})         
    } 
}

exports.storeRoomServices = async (req, res) => {
    try {
        const roomType = await getRoomType(req.params.id, req.user.hotel_id)
        if(!roomType){
            return res.status(400).send({message: 'Room type not found'})
        }        
        const {values, errMsg} = await validateInput(req, ['roomServiceIds'])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        await RoomTypeRoomService.bulkCreate(values.roomServiceIds.map(roomServiceId => ({
            room_type_id: req.params.id,
            room_service_id: roomServiceId
        })))
        return res.send({
            roomType: await getRoomType(req.params.id, req.user.hotel_id), 
            message: 'Room service successfully added'
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
            // Make sure the room type name is unique by hotel
            name: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const filters = [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), Sequelize.fn('lower', value)),
                    {hotel_id: req.user.hotel_id}                    
                ]
                // When the room type is updated
                if(req.params.id){
                    filters.push({[Op.not]: [{id: req.params.id}]})                    
                }
                const roomType = await RoomType.findOne({where: filters, attributes: ['id']})

                if(roomType){
                    throw {message: 'The room type name already taken'}
                }
                return value
            }).messages({
                'string.max': 'The room type name must below 100 characters',
            }),
            roomServiceIds: Joi.array().required().items(Joi.number().integer()).external(async (value, helpers) => {
                const uniqueIds = [... new Set(value)]
                if(uniqueIds.length !== uniqueIds.length){
                    throw {message: 'There are duplicate in added room services'}
                }
                const alrAddedRoomServices = await RoomTypeRoomService.findAll({
                    where: {room_type_id: req.params.id, room_service_id: value}
                })
                if(alrAddedRoomServices.length !== 0){
                    throw {message: 'Some of the room services already added'}
                }
                return value
            })
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

const getRoomType = async (id, hotelId) => {
    try {
        return await RoomType.findOne({
            attributes: ['id', 'name'],
            where: {id: id, hotel_id: hotelId},
            include: [
                {
                    model: RoomTypeRoomService, as: 'roomServiceList',
                    attributes: ['id'],
                    include: [
                        {
                            model: RoomService, as: 'roomService',
                            attributes: ['id', 'name'],                            
                        }
                    ]                    
                }
            ],            
        })
    } catch (error) {
        throw error
    }
}