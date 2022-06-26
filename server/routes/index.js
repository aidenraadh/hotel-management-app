const rootRouter            = require('express').Router()
const AuthController        = require('../controllers/AuthController')
const UserController        = require('../controllers/UserController')
const RoomTypeController    = require('../controllers/RoomTypeController')
const GuestTypeController   = require('../controllers/GuestTypeController')
const RoomController        = require('../controllers/RoomController')
const RoomPricingController = require('../controllers/RoomPricingController')
const RoomServiceController = require('../controllers/RoomServiceController')
const isAuth                = require('../middlewares/isAuth')
const isNotAuth             = require('../middlewares/isNotAuth')

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

rootRouter
    .get('/guest-types', [isAuth, GuestTypeController.index])
    .post('/guest-types', [isAuth, GuestTypeController.store])
    .put('/guest-types/:id', [isAuth, GuestTypeController.update])
    .delete('/guest-types/:id', [isAuth, GuestTypeController.destroy])

rootRouter
    .get('/rooms', [isAuth, RoomController.index])
    .post('/rooms', [isAuth, RoomController.store])
    .put('/rooms/:id', [isAuth, RoomController.update])
    .delete('/rooms/:id', [isAuth, RoomController.destroy])

rootRouter
    .get('/room-pricings', [isAuth, RoomPricingController.index])  
    .get('/room-pricings/create', [isAuth, RoomPricingController.create])   
    .post('/room-pricings', [isAuth, RoomPricingController.store])  
    .get('/room-pricings/edit/:roomTypeId', [isAuth, RoomPricingController.edit]) 
    .put('/room-pricings/:roomTypeId', [isAuth, RoomPricingController.update])  
    .delete('/room-pricings/:roomTypeId', [isAuth, RoomPricingController.destroy])  

rootRouter
    .get('/room-services', [isAuth, RoomServiceController.index])  
    .post('/room-services', [isAuth, RoomServiceController.store])  
    .put('/room-services/:id', [isAuth, RoomServiceController.update])  
    .delete('/room-pricings/:id', [isAuth, RoomServiceController.destroy])     
    
module.exports = rootRouter