const model      = require('../models/index')
const RoomPricing   = model.RoomPricing
const RoomType   = model.RoomType
const GuestType   = model.GuestType
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
        const roomTypes = await RoomType.findAll({
            attributes: ['id', 'name'],
            where: (() => {
                const where = {...filters.where, hotel_id: req.user.hotel_id}
                if(where.name){ where.name =  {[Op.iLike]: `%${where.name}%`}}
                return where
            })(),
            include: [
                {
                    model: RoomPricing, as: 'roomPricings',
                    attributes: {exclude: ['room_type_id', 'guest_type_id', 'created_at', 'updated_at']},
                    include: [
                        // Get guest type, make sure the guest type and for the hotel exists
                        {
                            model: GuestType, as: 'guestType', attributes: ['id', 'name'],
                        }
                    ]
                }
            ],
            order: [['id', 'DESC']],
            ...filters.limitOffset
        })
        res.send({
            roomTypes: roomTypes,
            filters: {...filters.where, ...filters.limitOffset}
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.store = async (req, res) => {
    try {
        const {values, errMsg} = await validateInput(req, ['storeRoomTypeId', 'storeRoomPricings'])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        await RoomPricing.bulkCreate(values.storeRoomPricings.map(roomPricing => ({
            room_type_id: values.storeRoomTypeId,
            guest_type_id: roomPricing.guestTypeId,
            price_on_monday: roomPricing.priceOnMonday,
            price_on_tuesday: roomPricing.priceOnTuesday,
            price_on_wednesday: roomPricing.priceOnWednesday,
            price_on_thursday: roomPricing.priceOnThursday,
            price_on_friday: roomPricing.priceOnFriday,
            price_on_saturday: roomPricing.priceOnSaturday,
            price_on_sunday: roomPricing.priceOnSunday,
        })))
        return res.send({
            message: 'Room pricings successfully created'
        })        
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})        
    }
}

exports.update = async (req, res) => {
    try {
        const {values, errMsg} = await validateInput(req, ['updateRoomPricings'])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        for (const roomPricing of values.updateRoomPricings) {
            await RoomPricing.update(
                {
                    price_on_monday: roomPricing.priceOnMonday,
                    price_on_tuesday: roomPricing.priceOnTuesday,
                    price_on_wednesday: roomPricing.priceOnWednesday,
                    price_on_thursday: roomPricing.priceOnThursday,
                    price_on_friday: roomPricing.priceOnFriday,
                    price_on_saturday: roomPricing.priceOnSaturday,
                    price_on_sunday: roomPricing.priceOnSunday,
                },
                {
                    where: {id: roomPricing.id}
                }
            )            
        }
        res.send({
            message: 'Room pricings successfully updated'
        })          
    } catch (err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})          
    }  
}

exports.destroy = async (req, res) => {
    try {
        const roomType = await RoomType.findOne({
            attributes: ['id'],
            where: {id: req.params.id, hotel_id: req.user.hotel_id}
        })
        if(!roomType){
            return res.status(400).send({
                message: 'Room pricings for this room type is not exist'
            })             
        }
        await RoomPricing.destroy({
            where: {room_type_id: req.params.roomTypeId}
        })
        res.send({
            message: 'Room pricings successfully deleted'
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
        if(input['storeRoomPricings']){

        }
        if(input['updateRoomPricings']){
            
        }        
        const rules = {
            // For storing
            storeRoomTypeId: Joi.number().required().integer().external(async (value, helpers) => {
                // Make sure the room type name is exists by hotel
                const roomType = await RoomType.findOne({
                    attributes: ['id'],
                    where: {id: value, hotel_id: req.user.hotel_id}
                })
                if(!roomType){
                    throw {message: 'The room type is not exist'}
                }                
                // Make sure room pricings is not exists for this room type
                const roomPricings = await RoomPricing.findOne({
                    attributes: ['id'],
                    where: {room_type_id: value}
                })
                if(roomPricings){
                    throw {message: 'Room pricings with this room type already exists'}
                }                   
                return value
            }),
            // For storing
            storeRoomPricings: Joi.array().required().items(Joi.object({
                guestTypeId: Joi.number().required().integer(),
                priceOnMonday: Joi.number().required().integer().allow('', null),
                priceOnTuesday: Joi.number().required().integer().allow('', null),
                priceOnWednesday: Joi.number().required().integer().allow('', null),
                priceOnThursday: Joi.number().required().integer().allow('', null),
                priceOnFriday: Joi.number().required().integer().allow('', null),
                priceOnSaturday: Joi.number().required().integer().allow('', null),
                priceOnSunday: Joi.number().required().integer().allow('', null),
            }).unknown(true)).external(async (value, helpers) => {
                console.log('haha')
                const guestTypeIds = value.map(roomPricing => (
                    roomPricing.guestTypeId
                ))
                if(guestTypeIds.length === 0){
                    throw {message: "Please add the guest type"}
                }
                const guestTypes = await GuestType.findAll({
                    attributes: ['id'],
                    where: {id: guestTypeIds, hotel_id: req.user.hotel_id},
                })
                // Make sure all guest types exists by hotel
                if(guestTypeIds.length !== guestTypes.length){
                    throw {message: "One of the guest type doesn't exist"}
                }
                const notPriceOnDayKeys = ['guestTypeId']
                // If the price is empty string, set it to null
                value.forEach((roomPricing, index) => {
                    for(const key in roomPricing){
                        if(!notPriceOnDayKeys.includes(key)){
                            if(roomPricing[key] === ''){ value[index][key] = null }
                        }
                    }
                })
                return value
            }),            
            // For updating
            updateRoomPricings: Joi.array().required().items(Joi.object({
                id: Joi.number().required().integer(),
                isEdited: Joi.boolean().required(),
                guestTypeId: Joi.number().required().integer(),
                priceOnMonday: Joi.number().required().integer().allow('', null),
                priceOnTuesday: Joi.number().required().integer().allow('', null),
                priceOnWednesday: Joi.number().required().integer().allow('', null),
                priceOnThursday: Joi.number().required().integer().allow('', null),
                priceOnFriday: Joi.number().required().integer().allow('', null),
                priceOnSaturday: Joi.number().required().integer().allow('', null),
                priceOnSunday: Joi.number().required().integer().allow('', null),
            }).unknown(true)).external(async (value, helpers) => {
                // Get all room pricing IDs
                const roomPricingIds = value.map(roomPricing => (
                    roomPricing.id
                ))
                const roomPricings = await RoomPricing.findAll({
                    attributes: ['id'],
                    where: {
                        id: roomPricingIds, hotel_id: req.user.hotel_id
                    },
                    include: [
                        // Get room type, make sure the room type and for the hotel exists
                        {
                            model: RoomType, as: 'roomType', attributes: ['id'],
                            where: {hotel_id: req.user.hotel_id}
                        },
                        // Get guest type, make sure the guest type and for the hotel exists
                        {
                            model: GuestType, as: 'guestType', attributes: ['id'],
                            where: {hotel_id: req.user.hotel_id}
                        }                    
                    ]
                })
                const sanitizedRoomPricings = values.filter(item => {
                    // Make sure the room pricing is edited
                    if(item.isEdited === false){
                        return false
                    }
                    const roomPricing = roomPricings.find(roomPricing => (
                        parseInt(roomPricing.id) === item.id
                    ))
                    // Make sure the room pricing exists
                    if(!roomPricing){
                        return false
                    }
                    // Make sure the room type and the guest type exist
                    return roomPricing.roomType && roomPricing.guestType
                })
                const notPriceOnDayKeys = ['guestTypeId', 'id']
                // If the price is empty string, set it to null
                sanitizedRoomPricings.forEach((roomPricing, index) => {
                    for(const key in roomPricing){
                        if(!notPriceOnDayKeys.includes(key)){
                            if(roomPricing[key] === ''){ value[index][key] = null }
                        }
                    }
                })                
                return sanitizedRoomPricings
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