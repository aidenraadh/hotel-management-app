import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    name: '',
    limit: 10, 
    offset: 0,
    not_for_store: ''
}

const guestTypeSlice = createSlice({
    name: 'roomService',
    initialState: {
        roomServices: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'roomServices' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append room service(s) to 'roomServices'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, roomServices: (
                    Array.isArray(payload.roomServices) ? 
                    [...state.roomServices, ...payload.roomServices] : 
                    [...state.roomServices, payload.roomServices]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.roomServices.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of room service(s) to 'roomServices'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, roomServices: (
                    Array.isArray(payload.roomServices) ? 
                    [...payload.roomServices, ...state.roomServices] : 
                    [payload.roomServices, ...state.roomServices]                
                ),
            };
        },
        // Replace a room service inside 'roomServices'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, roomServices: (() => {
                    const roomServices = [...state.roomServices]
                    roomServices[payload.index] = payload.roomService
                    return roomServices
                })()
            };  
        },       
        // Remove room service(s) from 'roomServices'
        remove: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, roomServices: (() => {
                    let roomServices = [...state.roomServices]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {roomServices.splice(index, 1)})
                        return roomServices
                    }
                    roomServices.splice(payload.indexes, 1)

                    return roomServices
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
                ...state, roomServices: payload.roomServices,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.roomServices.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = guestTypeSlice.actions
export default guestTypeSlice.reducer