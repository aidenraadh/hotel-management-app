import { configureStore } from "@reduxjs/toolkit"

import roomTypeReducer from './features/roomTypeSlice'
import guestTypeReducer from './features/guestTypeSlice'
import roomReducer from './features/roomSlice'
import roomPricingReducer from './features/roomPricingSlice'


const store = configureStore({
    reducer: {
        roomType: roomTypeReducer,
        guestType: guestTypeReducer,
        room: roomReducer,
        roomPricing: roomPricingReducer
    }
})
export default store