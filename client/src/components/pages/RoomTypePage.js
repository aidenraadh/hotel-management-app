import { useCallback, useEffect, useReducer, useState } from 'react'

import { ACTIONS, FILTER_ACTIONS, filterReducer, getFilters } from '../../reducers/RoomTypeReducer'
import { Button } from '../Buttons'

import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal } from '../Windows'
import { api, errorHandler, getQueryString, formatNum } from '../Utils'
import { Grid } from '../Layouts'
import { Select, TextInput } from '../Forms'

function RoomTypePage({roomType, dispatchRoomType, user}){
    const [disableBtn , setDisableBtn] = useState(false)
    // Filter room types
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters())
    const [filterModalShown, setFilterModalShown] = useState(false)
    // Create / edit room type
    const [roomTypeIndex, setRoomTypeIndex] = useState('')
    const [name, setName] = useState('')
    const [roomPrice, setRoomPrice] = useState('')
    const [makeRoomTypeMdlheading, setMakeRoomTypeMdlheading] = useState('')
    const [makeRoomTypeMdlShown, setMakeRoomTypeMdlShown] = useState(false)

    const getRoomTypes = useCallback((actionType) => {
        // Get the queries
        const queries = {...filters}     
        // When the room type is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)  

        if(roomType.initialLoad === false){
            setDisableBtn(true)
        }                  
        api.get(`/room-types${getQueryString(filters)}`)
        .then(response => {
            const responseData = response.data
            setDisableBtn(false)
            setFilterModalShown(false)
            dispatchFilters({type: FILTER_ACTIONS.RESET, payload: {
                filters: responseData.filters,
            }})
            dispatchRoomType({type: actionType, payload: {
                roomTypes: responseData.roomTypes,
                filters: responseData.filters
            }})
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [filters, roomType.initialLoad, dispatchRoomType])

    const editRoomType = useCallback((index) => {
        // Get the room type
        const targetRoomType = roomType.roomTypes[index]
        setRoomTypeIndex(index)
        setName(targetRoomType.name)
        setRoomPrice(targetRoomType.room_price)
        setMakeRoomTypeMdlheading('Edit Room Type')
        setMakeRoomTypeMdlShown(true)
    }, [roomType.roomTypes])

    useEffect(() => {       
        if(roomType.initialLoad === false){
            getRoomTypes(ACTIONS.RESET)
        }
    }, [roomType.initialLoad, getRoomTypes])
    
    if(roomType.initialLoad === false){
        return 'Loading ...'
    }
    return <>
        <section className='flex-row items-center content-end' style={{marginBottom: '1.4rem'}}>
            <Button
                size={'sm'} text={'Filter'} attr={{
                    onClick: () => {setFilterModalShown(true)}
                }}
            />
        </section>    
        <PlainCard
            body={<Grid numOfColumns={1} items={[
                <section className='flex-row items-center'>
                    <TextInput containerAttr={{style: {width: '100%', marginRight: '1rem'}}}
                        formAttr={{
                            placeholder: 'Search room type', value: filters.name,
                            onChange: (e) => {dispatchFilters({type: FILTER_ACTIONS.UPDATE, payload: {
                                key: 'name', value: e.target.value
                            }})}
                        }}
                    />
                    <Button text={'Search'} iconName={'search'} iconOnly={'true'} attr={{
                        style: {flexShrink: 0},
                        disabled: disableBtn,
                        onClick: () => {getRoomTypes(ACTIONS.RESET)}
                    }}/>      
                </section>,
                <RoomTypesTable
                    roomTypes={roomType.roomTypes}
                    editHandler={editRoomType}
                />     
            ]}/>}
        />
        <Modal
            size={'sm'} 
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
            heading={'Filter Room Type'}
            body={<>
                <Grid numOfColumns={1} items={[
                    <Select label={'Rows shown'} formAttr={{value: filters.limit, onChange: (e) => {
                            dispatchFilters({type: FILTER_ACTIONS.UPDATE, payload: {
                                key: 'limit', value: e.target.value
                            }})
                        }}}
                        options={[{value: 10}, {value: 20}, {value: 30}]}                        
                    />
                ]}/>
            </>}
            footer={<Button text={'Filter'} attr={{
                disabled: disableBtn, onClick: () => {getRoomTypes(ACTIONS.RESET)}
            }}/>}
        />
        <Modal
            size={'sm'} 
            shown={makeRoomTypeMdlShown}
            toggleModal={() => {setMakeRoomTypeMdlShown(state => !state)}}
            heading={makeRoomTypeMdlheading}
            body={roomType.roomTypes[roomTypeIndex] === undefined ? '' :
                <Grid numOfColumns={1} items={[
                    <TextInput label={'Room type name'}
                        formAttr={{
                            value: name, onChange: (e) => {setName(e.target.value)}
                        }}
                    />,
                    <TextInput label={'Room price'}
                        formAttr={{
                            value: formatNum(roomPrice), 
                            onChange: (e) => {setRoomPrice(formatNum(e.target.value, true))}
                        }}
                    />,                    
                ]}/>
            }
            footer={<Button text={'Update'} attr={{
                disabled: disableBtn, onClick: () => {}
            }}/>}
        />        
    </>
}

const RoomTypesTable = ({roomTypes, editHandler, removeHandler}) => {
    return <Table
        headings={['Name', 'Room Price', 'Actions']}
        body={roomTypes.map((roomType, index) => ([
            roomType.name, 
            'Rp. '+formatNum(roomType.room_price),
            <>
                <Button size={'sm'} type={'light'} text={'Edit'} attr={{
                    onClick: () => {editHandler(index)}
                }}/>
            </>
        ]))}
    />
}

export default RoomTypePage