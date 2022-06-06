import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    name: '',
    limit: 10, 
    offset: 0,      
}

const roomSlice = createSlice({
    name: 'room',
    initialState: {
        rooms: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'rooms' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append rooms(s) to 'rooms'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, rooms: (
                    Array.isArray(payload.rooms) ? 
                    [...state.rooms, ...payload.rooms] : 
                    [...state.rooms, payload.rooms]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.rooms.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of room(s) to 'rooms'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, rooms: (
                    Array.isArray(payload.rooms) ? 
                    [...payload.rooms, ...state.rooms] : 
                    [payload.rooms, ...state.rooms]                
                ),
            };
        },
        // Replace a room inside 'rooms'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, rooms: (() => {
                    const rooms = [...state.rooms]
                    rooms[payload.index] = payload.room
                    return rooms
                })()
            };  
        },       
        // Remove room(s) from 'rooms'
        remove: (state, action) => {
            const payload = {...action.payload}
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
        },
        // Update the 'filters'
        updateFilters: (state, action) => {
            const payload = {...action.payload}
            const filterKeys = Object.keys(filters)
            const updatedFilters = {...state.filters}
            for (const index in payload) {
                // Make sure the filter key is exists
                if(filterKeys.includes(payload[index].key)){
                    updatedFilters[payload[index].key] = payload[index].value
                    // If the filter is limit or offset
                    if(payload[index].key === 'limit' || payload[index].key === 'offset'){
                        updatedFilters[payload[index].key] = parseInt(updatedFilters[payload[index].key])
                    }     
                }                  
            }
            return {...state, filters: {...state.lastFilters, ...updatedFilters}}
        },   
        // Sync 'filters' with 'lastFilters'
        syncFilters: (state, action) => {
            return {...state, filters: {...state.lastFilters}}
        },
        // Reset this state with new fresh data
        reset: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, rooms: payload.rooms,
                roomTypes: payload.roomTypes,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.rooms.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = roomSlice.actions
export default roomSlice.reducer