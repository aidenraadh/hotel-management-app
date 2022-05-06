const model      = require('../models/index')
const RoomPricing   = model.RoomPricing
const RoomType   = model.RoomType
const GuestType   = model.GuestType
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
                    attributes: {exclude: ['room_type_id', 'guest_type_id']},
                    include: [
                        {
                            model: GuestType, as: 'guestType',
                            attributes: ['id', 'name']
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
        await roomType.destroy()
        
        res.send({
            message: 'Room type successfully deleted'
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
        return await RoomType.findOne({where: {
            id: id, hotel_id: hotelId
        }})
    } catch (error) {
        throw error
    }
}