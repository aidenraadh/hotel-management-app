const model       = require('../models/index')
const RoomPricing = model.RoomPricing
const RoomType    = model.RoomType
const GuestType   = model.GuestType
const {Op}        = require("sequelize")
const Joi         = require('joi')
const filterKeys  = require('../utils/filterKeys')
const logger      = require('../utils/logger')

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
                    required: true, // Get only room type that has room pricings
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

exports.create = async (req, res) => {
    try {
        // Get the room types
        const roomTypes = await RoomType.findAll({
            where: {hotel_id: req.user.hotel_id},
            attributes: ['id','name'],
            order: [['id', 'DESC']],
        })        
        // Get the guest types
        const guestTypes = await GuestType.findAll({
            where: {hotel_id: req.user.hotel_id},
            attributes: ['id','name'],
            order: [['id', 'DESC']],
        })
        res.send({
            roomTypes: roomTypes,
            guestTypes: guestTypes,
        })
    } catch(err) {
        logger.error(err, {errorObj: err})
        res.status(500).send({message: err.message})
    }
}

exports.edit = async (req, res) => {
    try {
        let id = parseInt(req.params.roomTypeId) ? parseInt(req.params.roomTypeId) : ''
        // Get the edited room type
        const roomType = await RoomType.findOne({
            attributes: ['id', 'name'],
            where: {id: id, hotel_id: req.user.hotel_id},
            include: [
                {
                    model: RoomPricing, as: 'roomPricings',
                    attributes: {exclude: ['room_type_id', 'guest_type_id', 'created_at', 'updated_at']},
                    required: true, // Get only room type that has room pricings
                    include: [
                        // Get guest type, make sure the guest type and for the hotel exists
                        {
                            model: GuestType, as: 'guestType', attributes: ['id', 'name'],
                        }
                    ]
                }
            ],
        })
        // Get the room types
        const roomTypes = await RoomType.findAll({
            where: {hotel_id: req.user.hotel_id},
            attributes: ['id','name'],
            order: [['id', 'DESC']],
        })           
        // Get the guest types
        const guestTypes = await GuestType.findAll({
            where: {hotel_id: req.user.hotel_id},
            attributes: ['id','name'],
            order: [['id', 'DESC']],
        })
        res.send({
            roomType: roomType,
            roomTypes: roomTypes,
            guestTypes: guestTypes,
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
        // Make sure the room type exist
        const roomType = await RoomType.findOne({
            where: {id: req.params.roomTypeId, hotel_id: req.user.hotel_id},
            attributes: ['id']
        })
        if(!roomType){
            return res.status(400).send({message: 'Room type is not exist'})
        }
        // Validate the input
        const {values, errMsg} = await validateInput(req, ['updateRoomPricings', 'deletedRoomPricingIds'])
        if(errMsg){
            return res.status(400).send({message: errMsg})
        }
        // Store the newly added room pricings
        if(values.updateRoomPricings.new.length){
            await RoomPricing.bulkCreate(values.updateRoomPricings.new.map(roomPricing => ({
                room_type_id: req.params.roomTypeId,
                guest_type_id: roomPricing.guestTypeId,
                price_on_monday: roomPricing.priceOnMonday === '' ? null : roomPricing.priceOnMonday,
                price_on_tuesday: roomPricing.priceOnTuesday === '' ? null : roomPricing.priceOnTuesday,
                price_on_wednesday: roomPricing.priceOnWednesday === '' ? null : roomPricing.priceOnWednesday,
                price_on_thursday: roomPricing.priceOnThursday === '' ? null : roomPricing.priceOnThursday,
                price_on_friday: roomPricing.priceOnFriday === '' ? null : roomPricing.priceOnFriday,
                price_on_saturday: roomPricing.priceOnSaturday === '' ? null : roomPricing.priceOnSaturday,
                price_on_sunday: roomPricing.priceOnSunday === '' ? null : roomPricing.priceOnSunday,            
            })))   
        }      
        // Update the edited room pricings
        for (const roomPricing of values.updateRoomPricings.edited) {
            await RoomPricing.update(
                {
                    price_on_monday: roomPricing.priceOnMonday === '' ? null : roomPricing.priceOnMonday,
                    price_on_tuesday: roomPricing.priceOnTuesday === '' ? null : roomPricing.priceOnTuesday,
                    price_on_wednesday: roomPricing.priceOnWednesday === '' ? null : roomPricing.priceOnWednesday,
                    price_on_thursday: roomPricing.priceOnThursday === '' ? null : roomPricing.priceOnThursday,
                    price_on_friday: roomPricing.priceOnFriday === '' ? null : roomPricing.priceOnFriday,
                    price_on_saturday: roomPricing.priceOnSaturday === '' ? null : roomPricing.priceOnSaturday,
                    price_on_sunday: roomPricing.priceOnSunday === '' ? null : roomPricing.priceOnSunday,
                },
                {
                    where: {id: roomPricing.id}
                }
            )            
        }    
        // Delete the deleted room pricings
        if(values.deletedRoomPricingIds.length){
            await removeRoomPricings(values.deletedRoomPricingIds, RoomPricing)
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
            where: {id: req.params.roomTypeId, hotel_id: req.user.hotel_id}
        })
        if(!roomType){
            return res.status(400).send({
                message: 'Room pricings for this room type is not exist'
            })             
        }
        await removeRoomPricings(roomType.id, RoomType)
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
 * @param {integer} id - ID of either room type of guest type 
 * @param {object} tableModel 
 */

exports.destroyRoomPricings = async (id, tableModel) => {
    try {
        await removeRoomPricings(id, tableModel)   
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
                id: Joi.number().required().integer().allow('', null),
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
                // Get all edited room pricings
                const editedRoomPricings = value.filter(roomPricing => (
                    roomPricing.id !== '' && roomPricing.isEdited === true
                ))
                // Get newly added room pricings
                const newRoomPricings = value.filter(roomPricing => (
                    roomPricing.id === ''
                ))  
                // Get all deleted room pricing IDs
                const deletedRoomPricingIds = input.deletedRoomPricingIds.map(id => parseInt(id))
                let roomPricings = null
                // Make sure all updated room pricings exist
                roomPricings = await RoomPricing.findAll({
                    attributes: ['id'],
                    where: {
                        id: editedRoomPricings.map(roomPricing => roomPricing.id),
                        room_type_id: req.params.roomTypeId
                    }
                })
                if(roomPricings.length !== editedRoomPricings.length){
                    throw {message: "One of the room pricing doesn't exist"}
                }
                // Make sure ID of the updated room pricings is not on the deleted room pricing IDs
                editedRoomPricings.forEach(roomPricing => {
                    if(deletedRoomPricingIds.includes(parseInt(roomPricing.id))){
                        throw {message: "The deleted and edited room pricings is mixed"}
                    }
                })
                // Make sure all guest type ID and room type ID from newly added room pricings is not exist
                roomPricings = await RoomPricing.findAll({
                    attributes: ['id'],
                    where: {
                        guest_type_id: newRoomPricings.map(roomPricing => roomPricing.guestTypeId),
                        room_type_id: req.params.roomTypeId
                    }
                })  
                if(roomPricings.length !== 0){
                    throw {message: "One of the room pricing already added"}
                }                                           
                return {
                    edited: editedRoomPricings,
                    new: newRoomPricings
                }
            }),
            // Make sure the deleted room pricing IDs belongs to the room type
            deletedRoomPricingIds: Joi.array().required().items(Joi.number().integer()).external(async (value, helpers) => {
                const roomPricings = await RoomPricing.findAll({
                    where: {id: value, room_type_id: req.params.roomTypeId}
                })
                if(roomPricings.length !== value.length){
                    throw {message: "One of the deleted room pricings is not exist"}
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
 * @param {integer} id - ID of either room type of guest type 
 * @param {object} tableModel 
 */

// Destroy room pricings by the room type or guest type
const removeRoomPricings = async (id, tableModel) => {
    try {
        let where = {}
        switch (tableModel.name) {
            case 'RoomType':
                where = {room_type_id: id}
                break;
            case 'GuestType':
                where = {guest_type_id: id}
                break;        
            case 'RoomPricing':
                where = {id: id}
                break;                  
            default:
                throw 'Cant delete room pricings by this model'
        }        
        await RoomPricing.destroy({where: where})        
    } catch (error) {
        throw new Error(error)
    }
}