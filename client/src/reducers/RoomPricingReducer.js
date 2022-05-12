import { saveResFilters, getResFilters } from "../components/Utils";

export const INIT_STATE = {
    roomTypes: [], // Array of room types
    canLoadMore: true, // Wheter or not the room types can be loaded more
    initialLoad: false, // Wheter or not the room types load is the first load
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
}

export const FILTER_KEY = 'roomPricing'
export const FILTER_ACTIONS = {
    UPDATE: 'UPDATE', RESET: 'RESET'
}

const roomPricingReducer = (state, action) => {
    const {type, payload} = action

    switch(type){
        // Append room type(s) to 'roomTypes'
        case ACTIONS.APPEND: return (() => {
            let addedRoomTypes;
            // Make sure the room type(s) has room pricings
            if(Array.isArray(payload.roomTypes)){
                addedRoomTypes = payload.roomTypes.filter(roomType => (
                    roomType.roomPricings.length !== 0
                ))  
            }
            else{
                addedRoomTypes = payload.roomTypes.roomPricings ? [payload.roomTypes] : []  
            }          
            const totalRoomTypes = [...state.roomTypes, ...addedRoomTypes]
            return {...state, 
                roomTypes: totalRoomTypes,
                canLoadMore: totalRoomTypes.length < payload.filters.limit ? false : true,
                initialLoad: true
            }            
        })()
        // Prepend array of room pricings(s) to 'roomTypes'
        case ACTIONS.PREPEND: return (() => {
            let addedRoomTypes;
            // Make sure the room type(s) has room pricings
            if(Array.isArray(payload.roomTypes)){
                addedRoomTypes = payload.roomTypes.filter(roomType => (
                    roomType.roomPricings.length !== 0
                ))  
            }
            else{
                addedRoomTypes = payload.roomTypes.roomPricings ? [payload.roomTypes] : []  
            }          
            const totalRoomTypes = [addedRoomTypes, ...state.roomTypes]
            return {...state, 
                roomTypes: totalRoomTypes,
                canLoadMore: totalRoomTypes.length < payload.filters.limit ? false : true,
                initialLoad: true
            }              
        })()
        // Replace a room type inside 'roomTypes'
        case ACTIONS.REPLACE: 
            return {
                ...state, roomTypes: (() => {
                    const roomPricings = [...state.roomTypes]
                    roomPricings[payload.index] = payload.roomPricing
                    return roomPricings
                })()
            };            
        // Remove room type(s) from 'roomTypes'
        case ACTIONS.REMOVE: 
            return {
                ...state, roomTypes: (() => {
                    let roomTypes = [...state.roomTypes]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {roomTypes.splice(index, 1)})
                        return roomTypes
                    }
                    roomTypes.splice(payload.indexes, 1)

                    return roomTypes
                })()
            }; 
        // Reset room type(s) from 'roomTypes'
        case ACTIONS.RESET: return (() => {
            const roomTypes = payload.roomTypes.filter(roomType => (
                roomType.roomPricings.length !== 0
            ))
            return {...state, 
                roomTypes: roomTypes,
                canLoadMore: roomTypes.length < payload.filters.limit ? false : true,
                initialLoad: true
            }
        })()          
        // Error
        default: throw new Error()
    }
}

export const filterReducer = (state, action) => {
    const {type, payload} = action
    // If the filter is resetted, save to the local storage
    if(type === FILTER_ACTIONS.RESET){
        saveResFilters(FILTER_KEY, payload.filters);
    }
    switch(type){
        case FILTER_ACTIONS.UPDATE: 
            if(payload.key === 'limit'){
                payload.value = parseInt(payload.value)
            }
            return {
                ...state, [payload.key]: payload.value
            }; 
        case FILTER_ACTIONS.RESET: 
            return {
                ...state, ...payload.filters
            };          
        // Error
        default: throw new Error()
    }
}

export const getFilters = () => {
    const defaultFilters = {
        name: '',
        limit: 10, 
        offset: 0,           
    }
    const filters = getResFilters(FILTER_KEY)
    return {...defaultFilters, ...filters}
}

export default roomPricingReducer