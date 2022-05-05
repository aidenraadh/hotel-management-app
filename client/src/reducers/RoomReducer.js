import { saveResFilters, getResFilters } from "../components/Utils";

export const INIT_STATE = {
    rooms: [], // Array of rooms
    canLoadMore: true, // Wheter or not the rooms can be loaded more
    initialLoad: false, // Wheter or not the room load is the first load
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
}

export const FILTER_KEY = 'room'
export const FILTER_ACTIONS = {
    UPDATE: 'UPDATE', RESET: 'RESET'
}

const roomReducer = (state, action) => {
    const {type, payload} = action

    switch(type){
        // Append room(s) to 'rooms'
        case ACTIONS.APPEND: 
            return {
                ...state, rooms: (
                    Array.isArray(payload.rooms) ? 
                    [...state.rooms, ...payload.rooms] : 
                    [...state.rooms, payload.rooms]
                ),
                canLoadMore: payload.rooms.length < payload.filters.limit ? false : true,
                initialLoad: true
            }; 
        // Prepend array of room(s) to 'rooms'
        case ACTIONS.PREPEND: 
            return {
                ...state, rooms: (
                    Array.isArray(payload.rooms) ? 
                    [...payload.rooms, ...state.rooms] : 
                    [payload.rooms, ...state.rooms]                
                ),

            };
        // Replace a room inside 'rooms'
        case ACTIONS.REPLACE: 
            return {
                ...state, rooms: (() => {
                    const rooms = [...state.rooms]
                    rooms[payload.index] = payload.room
                    return rooms
                })()
            };            
        // Remove room(s) from 'rooms'
        case ACTIONS.REMOVE: 
            return {
                ...state, rooms: (() => {
                    let rooms = [...state.rooms]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {rooms.splice(index, 1)})
                        return rooms
                    }
                    rooms.splice(payload.indexes, 1)

                    return rooms
                })()
            }; 
        // Reset room(s) from 'rooms'
        case ACTIONS.RESET: 
            return {
                ...state, rooms: [...payload.rooms],
                canLoadMore: payload.rooms.length < payload.filters.limit ? false : true,
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
        // Append room(s) to 'rooms'
        case FILTER_ACTIONS.UPDATE: 
            if(payload.key === 'limit'){
                payload.value = parseInt(payload.value)
            }
            return {
                ...state, [payload.key]: payload.value
            }; 
        // Prepend array of room(s) to 'rooms'
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

export default roomReducer