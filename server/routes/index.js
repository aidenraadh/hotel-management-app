const rootRouter         = require('express').Router()
const AuthController     = require('../controllers/AuthController')
const UserController     = require('../controllers/UserController')
const RoomTypeController = require('../controllers/RoomTypeController')
const isAuth             = require('../middlewares/isAuth')
const isNotAuth          = require('../middlewares/isNotAuth')

rootRouter.post('/register', [
    isNotAuth, AuthController.register
])
rootRouter.post('/login', [
    isNotAuth, AuthController.login
])
rootRouter
    .put('/users/update-profile', [
        isAuth, UserController.updateProfile
    ])

rootRouter
    .get('/room-types', [isAuth, RoomTypeController.index])
    .post('/room-types', [isAuth, RoomTypeController.store])
    .put('/room-types/:id', [isAuth, RoomTypeController.update])
    .delete('/room-types/:id', [isAuth, RoomTypeController.destroy])
    
module.exports = rootRouter