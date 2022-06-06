import { createSlice } from '@reduxjs/toolkit'

// Define all your filters here
const filters = {
    name: '',
    limit: 10, 
    offset: 0,      
}

const guestTypeSlice = createSlice({
    name: 'guestType',
    initialState: {
        guestTypes: [],
        lastFilters: filters, // Contains last filters from the server
        filters: filters, // Contains changeable filters
        canLoadMore: true, // Whether or not the 'guestTypes' can be loaded more
        isLoaded: false, // Where or not this state is already loaded
    },
    reducers: {
        // Append guest type(s) to 'guestTypes'
        append: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, guestTypes: (
                    Array.isArray(payload.guestTypes) ? 
                    [...state.guestTypes, ...payload.guestTypes] : 
                    [...state.guestTypes, payload.guestTypes]
                ),
                filters: {...state.lastFilters, ...payload.filters},
                lastFilters: {...state.lastFilters, ...payload.filters},
                canLoadMore: payload.guestTypes.length < payload.filters.limit ? false : true,
            }
        },
        // Prepend array of guest type(s) to 'guestTypes'
        prepend: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, guestTypes: (
                    Array.isArray(payload.guestTypes) ? 
                    [...payload.guestTypes, ...state.guestTypes] : 
                    [payload.guestTypes, ...state.guestTypes]                
                ),
            };
        },
        // Replace a guest type inside 'guestTypes'
        replace: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, guestTypes: (() => {
                    const guestTypes = [...state.guestTypes]
                    guestTypes[payload.index] = payload.guestType
                    return guestTypes
                })()
            };  
        },       
        // Remove guest type(s) from 'guestTypes'
        remove: (state, action) => {
            const payload = {...action.payload}
            return {
                ...state, guestTypes: (() => {
                    let guestTypes = [...state.guestTypes]
                    if(Array.isArray(payload.indexes)){
                        payload.indexes.forEach(index => {guestTypes.splice(index, 1)})
                        return guestTypes
                    }
                    guestTypes.splice(payload.indexes, 1)

                    return guestTypes
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
                ...state, guestTypes: payload.guestTypes,
                filters: {...filters, ...payload.filters},
                lastFilters: {...filters, ...payload.filters},
                isLoaded: true,
                canLoadMore: payload.guestTypes.length < payload.filters.limit ? false : true,
            }
        }
    }
})

export const {append, prepend, replace, remove, updateFilters, syncFilters, reset} = guestTypeSlice.actions
export default guestTypeSlice.reducer