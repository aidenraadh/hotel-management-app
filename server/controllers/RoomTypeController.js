const model      = require('../models/index')
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
        const roomTypes = await RoomType.findAll({
            where: (() => {
                const where = {...filters.where, owner_id: req.user.owner_id}
                if(where.name){ where.name =  {[Op.iLike]: `%${where.name}%`}}
                return where
            })(),
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
    const {values, errorMsg} = await validateInput(req, ['name', 'roomPrice'])
    if(errorMsg){
        return res.status(400).send({message: errorMsg})
    }
    const roomType = await RoomType.create({
        name: values.name, room_price: values.roomPrice, owner_id: req.user.owner_id,
    })
    res.send({
        roomType: roomType,
        message: 'Room type successfully created'
    })
}

exports.update = async (req, res) => {
    const roomType = await getRoomType(req.params.id, req.user.owner_id)
    if(!roomType){
        return res.status(400).send({message: 'Room type not found'})
    }
    const {values, errorMsg} = await validateInput(req, ['name', 'roomPrice'])
    if(errorMsg){
        return res.status(400).send({message: errorMsg})
    }
    roomType.name = values.name

    roomType.room_price = values.roomPrice

    await roomType.save()    

    res.send({
        roomType: roomType,
        message: 'Room type successfully updated'
    })    
}

exports.destroy = async (req, res) => {
    const roomType = await getRoomType(req.params.id, req.user.owner_id)
    if(!roomType){
        return res.status(400).send({message: 'Room type not found'})
    }
    await RoomType.destroy({where: {
        id: req.params.id
    }})
    res.send({
        message: 'Room type successfully deleted'
    })     
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
            // Make sure the room type name is unique by owner
            name: Joi.string().required().trim().max(100).external(async (value, helpers) => {
                const filters = [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), Sequelize.fn('lower', value)),
                    {owner_id: req.user.id}                    
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

            roomPrice: Joi.number().required().integer().min(0).allow(null, ''),
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
 * @param {integer} ownerId 
 * @returns object
 */

const getRoomType = async (id, ownerId) => {
    try {
        return await RoomType.findOne({where: {
            id: id, owner_id: ownerId
        }})
    } catch (error) {
        throw error
    }
}