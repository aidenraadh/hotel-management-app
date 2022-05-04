const rootRouter      = require('express').Router()
const AuthController  = require('../controllers/AuthController')
const UserController  = require('../controllers/UserController')
const RoomTypeController = require('../controllers/RoomTypeController')
const isAuth          = require('../middlewares/isAuth')
const isNotAuth       = require('../middlewares/isNotAuth')

rootRouter.post('/register', [
    isNotAuth, AuthController.register
])
rootRouter.post('/login', [
    isNotAuth, AuthController.login
])
rootRouter.put('/profile', [
    isAuth, UserController.update
])

rootRouter
    .get('/room-types', [isAuth, RoomTypeController.index])
    
module.exports = rootRouter