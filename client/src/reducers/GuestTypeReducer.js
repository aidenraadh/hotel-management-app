import { saveResFilters, getResFilters } from "../components/Utils";

export const INIT_STATE = {
    guestTypes: [], // Array of guest types
    canLoadMore: true, // Wheter or not the guest types can be loaded more
    initialLoad: false, // Wheter or not the guest type load is the first load
}
export const ACTIONS = {
    APPEND: 'APPEND', 
    PREPEND: 'PREPEND',
    REPLACE: 'REPLACE',
    REMOVE: 'REMOVE',
    RESET: 'RESET',
}

export const FILTER_KEY = 'guestType'
export const FILTER_ACTIONS = {
    UPDATE: 'UPDATE', RESET: 'RESET'
}

const guestTypeReducer = (state, action) => {
    const {type, payload} = action

    switch(type){
        // Append guest type(s) to 'guestTypes'
        case ACTIONS.APPEND: 
            return {
                ...state, guestTypes: (
                    Array.isArray(payload.guestTypes) ? 
                    [...state.guestTypes, ...payload.guestTypes] : 
                    [...state.guestTypes, payload.guestTypes]
                ),
                canLoadMore: payload.guestTypes.length < payload.filters.limit ? false : true,
                initialLoad: true
            }; 
        // Prepend array of guest type(s) to 'guestTypes'
        case ACTIONS.PREPEND: 
            return {
                ...state, guestTypes: (
                    Array.isArray(payload.guestTypes) ? 
                    [...payload.guestTypes, ...state.guestTypes] : 
                    [payload.guestTypes, ...state.guestTypes]                
                ),

            };
        // Replace a guest type inside 'guestTypes'
        case ACTIONS.REPLACE: 
            return {
                ...state, guestTypes: (() => {
                    const guestTypes = [...state.guestTypes]
                    guestTypes[payload.index] = payload.guestType
                    return guestTypes
                })()
            };            
        // Remove guest type(s) from 'guestTypes'
        case ACTIONS.REMOVE: 
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
        // Reset guest type(s) from 'guestTypes'
        case ACTIONS.RESET: 
            return {
                ...state, guestTypes: [...payload.guestTypes],
                canLoadMore: payload.guestTypes.length < payload.filters.limit ? false : true,
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
        // Append guest type(s) to 'guestTypes'
        case FILTER_ACTIONS.UPDATE: 
            if(payload.key === 'limit'){
                payload.value = parseInt(payload.value)
            }
            return {
                ...state, [payload.key]: payload.value
            }; 
        // Prepend array of guest type(s) to 'guestTypes'
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

export default guestTypeReducer