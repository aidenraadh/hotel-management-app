import { saveResFilters, getResFilters } from "../components/Utils";

export const INIT_STATE = {
    roomTypes: [], // Array of room types
    canLoadMore: true, // Wheter or not the room types can be loaded more
    initialLoad: false, // Wheter or not the room type load is the first load
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
}

export const FILTER_KEY = 'roomType'
export const FILTER_ACTIONS = {
    UPDATE: 'UPDATE', RESET: 'RESET'
}

const roomTypeReducer = (state, action) => {
    const {type, payload} = action

    switch(type){
        // Append room type(s) to 'roomTypes'
        case ACTIONS.APPEND: 
            return {
                ...state, roomTypes: (
                    Array.isArray(payload.roomTypes) ? 
                    [...state.roomTypes, ...payload.roomTypes] : 
                    [...state.roomTypes, payload.roomTypes]
                ),
                canLoadMore: payload.roomTypes.length < payload.filters.limit ? false : true,
                initialLoad: true
            }; 
        // Prepend array of room types(s) to 'roomTypes'
        case ACTIONS.PREPEND: 
            return {
                ...state, roomTypes: (
                    Array.isArray(payload.roomTypes) ? 
                    [...payload.roomTypes, ...state.roomTypes] : 
                    [payload.roomTypes, ...state.roomTypes]                
                ),

            };
        // Replace a room type inside 'roomTypes'
        case ACTIONS.REPLACE: 
            return {
                ...state, roomTypes: (() => {
                    const roomTypes = [...state.roomTypes]
                    roomTypes[payload.index] = payload.roomType
                    return roomTypes
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
        case ACTIONS.RESET: 
            return {
                ...state, roomTypes: [...payload.roomTypes],
                canLoadMore: payload.roomTypes.length < payload.filters.limit ? false : true,
                initialLoad: true
            };             
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
        // Append room type(s) to 'roomTypes'
        case FILTER_ACTIONS.UPDATE: 
            if(payload.key === 'limit'){
                payload.value = parseInt(payload.value)
            }
            return {
                ...state, [payload.key]: payload.value
            }; 
        // Prepend array of room types(s) to 'roomTypes'
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

export default roomTypeReducer