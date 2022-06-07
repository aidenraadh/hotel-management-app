import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    name: '',
    limit: 10, 
    offset: 0,      
}

const roomPricingSlice = createSlice({
    name: 'roomPricing',
    initialState: {
        roomTypes: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'roomTypes' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append room type(s) to 'roomTypes'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, roomTypes: (
                    Array.isArray(payload.roomTypes) ? 
                    [...state.roomTypes, ...payload.roomTypes] : 
                    [...state.roomTypes, payload.roomTypes]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.roomTypes.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of room types(s) to 'roomTypes'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, roomTypes: (
                    Array.isArray(payload.roomTypes) ? 
                    [...payload.roomTypes, ...state.roomTypes] : 
                    [payload.roomTypes, ...state.roomTypes]                
                ),
            };
        },
        // Replace a room type inside 'roomTypes'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, roomTypes: (() => {
                    const roomTypes = [...state.roomTypes]
                    roomTypes[payload.index] = payload.roomPricing
                    return roomTypes
                })()
            };  
        },       
        // Remove room type(s) from 'roomTypes'
        remove: (state, action) => {
            const payload = {...action.payload}
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
                ...state, roomTypes: payload.roomTypes,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.roomTypes.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = roomPricingSlice.actions
export default roomPricingSlice.reducer