import { configureStore } from "@reduxjs/toolkit"

import roomTypeReducer from './features/roomTypeSlice'
import guestTypeReducer from './features/guestTypeSlice'


const store = configureStore({
    reducer: {
        roomType: roomTypeReducer,
        guestType: guestTypeReducer,
    }
})
export default store