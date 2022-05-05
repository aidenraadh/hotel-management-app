import { useCallback, useEffect, useReducer, useState } from 'react'

import { ACTIONS, FILTER_ACTIONS, filterReducer, getFilters } from '../../reducers/RoomTypeReducer'
import { Button } from '../Buttons'

import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal, ConfirmPopup } from '../Windows'
import { api, errorHandler, getQueryString, formatNum, keyHandler } from '../Utils'
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
    /* Delete room type */
    const [popupShown, setPopupShown] = useState(false)    
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')    

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

    const createRoomType = useCallback(() => {
        setRoomTypeIndex('')
        setName('')
        setRoomPrice('')
        setMakeRoomTypeMdlheading('Create Room Type')
        setMakeRoomTypeMdlShown(true)        
    }, [])

    const storeRoomType = useCallback(() => {
        setDisableBtn(true)

        api.post(`/room-types`, {
            name: name, roomPrice: roomPrice
        })
        .then(response => {
            setDisableBtn(false)
            setMakeRoomTypeMdlShown(false)                
            dispatchRoomType({type: ACTIONS.PREPEND, payload: {
                roomTypes: response.data.roomType,
            }})
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatchRoomType, name, roomPrice])

    const editRoomType = useCallback((index) => {
        const targetRoomType = roomType.roomTypes[index] // Get the room type
        setRoomTypeIndex(index)
        setName(targetRoomType.name)
        setRoomPrice(targetRoomType.room_price)
        setMakeRoomTypeMdlheading('Edit Room Type')
        setMakeRoomTypeMdlShown(true)
    }, [roomType.roomTypes])

    const updateRoomType = useCallback(() => {
        const targetRoomType = roomType.roomTypes[roomTypeIndex] // Get the room type
        setDisableBtn(true)

        api.put(`/room-types/${targetRoomType.id}`, {
            name: name, roomPrice: roomPrice
        })
        .then(response => {
            setDisableBtn(false)
            setMakeRoomTypeMdlShown(false)      
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)                         
            dispatchRoomType({type: ACTIONS.REPLACE, payload: {
                roomType: response.data.roomType,
                index: roomTypeIndex
            }})
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatchRoomType, name, roomPrice, roomType.roomTypes, roomTypeIndex])

    const confirmDeleteRoomType = useCallback(index => {
        setRoomTypeIndex(index)
        setPopupShown(true)
    }, [])    

    const deleteRoomType = useCallback(() => {
        const targetRoomType = roomType.roomTypes[roomTypeIndex] // Get the room type
        setDisableBtn(true)

        api.delete(`/room-types/${targetRoomType.id}`)     
            .then(response => {   
                setDisableBtn(false)
                setSuccPopupMsg(response.data.message)
                setSuccPopupShown(true)                     
                dispatchRoomType({
                    type: ACTIONS.REMOVE, 
                    payload: {indexes: roomTypeIndex}
                })                
            })
            .catch(err => {
                errorHandler(err, {'400': () => {
                    setDisableBtn(false)
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                      
                }})               
            })          
    }, [dispatchRoomType, roomType.roomTypes, roomTypeIndex])


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
                size={'sm'} text={'Filter'} iconName={'sort_1'} attr={{
                    style: {marginRight: '1rem'},
                    onClick: () => {setFilterModalShown(true)}
                }}
            />
            <Button
                size={'sm'} text={'+ Create'} 
                attr={{onClick: createRoomType}}
            />            
        </section>    
        <PlainCard
            body={<Grid numOfColumns={1} items={[
                <section className='flex-row items-center'>
                    <TextInput containerAttr={{style: {width: '100%', marginRight: '1rem'}}}
                        formAttr={{
                            placeholder: 'Search room types', value: filters.name,
                            onChange: (e) => {dispatchFilters({type: FILTER_ACTIONS.UPDATE, payload: {
                                key: 'name', value: e.target.value
                            }})},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getRoomTypes(ACTIONS.RESET)})}                              
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
                    deleteHandler={confirmDeleteRoomType}
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
            body={<Grid numOfColumns={1} items={[
                <TextInput label={'Room type name'}
                    formAttr={{
                        value: name, onChange: (e) => {setName(e.target.value)},
                        onKeyUp: (e) => {keyHandler(
                            e, 'Enter', (roomTypeIndex === '' ? storeRoomType : updateRoomType)
                        )}
                    }}
                />,
                <TextInput label={'Room price'}
                    formAttr={{
                        value: formatNum(roomPrice), 
                        onChange: (e) => {setRoomPrice(formatNum(e.target.value, true))},
                        onKeyUp: (e) => {keyHandler(
                            e, 'Enter', (roomTypeIndex === '' ? storeRoomType : updateRoomType)
                        )}                        
                    }}
                />,                    
            ]}/>}
            footer={<Button text={'Update'} attr={{
                disabled: disableBtn, onClick: () => {
                    // When creating room type
                    if(roomTypeIndex === ''){ storeRoomType() }
                    // When creating room type
                    else{ updateRoomType() }
                }
            }}/>}
        />        
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this room type?'}
            confirmText={'Remove'}
            cancelText={'Cancel'}
            shown={popupShown} togglePopup={() => {setPopupShown(state => !state)}} 
            confirmCallback={deleteRoomType}
        />
        <ConfirmPopup
            shown={errPopupShown}
            icon={'error_circle'}
            iconColor={'red'}
            title={"Can't Proceed"}
            body={popupErrMsg}
            confirmText={'OK'}
            togglePopup={() => {setErrPopupShown(state => !state)}} 
        />         
        <ConfirmPopup
            shown={succPopupShown}
            icon={'done_circle'}
            iconColor={'blue'}
            title={"Success"}
            body={popupSuccMsg}
            confirmText={'OK'}
            togglePopup={() => {setSuccPopupShown(state => !state)}} 
        />         
    </>
}

const RoomTypesTable = ({roomTypes, editHandler, deleteHandler}) => {
    return <Table
        headings={['Name', 'Room Price', 'Actions']}
        body={roomTypes.map((roomType, index) => ([
            roomType.name, 
            'Rp. '+(roomType.room_price ? formatNum(roomType.room_price) : 0),
            <>
                <Button size={'sm'} type={'light'} text={'Edit'} attr={{
                    onClick: () => {editHandler(index)}
                }}/>
                <Button size={'sm'} type={'light'} color={'red'} text={'Delete'} attr={{
                    style: {marginLeft: '1rem'},
                    onClick: () => {deleteHandler(index)}
                }}/>                
            </>
        ]))}
    />
}

export default RoomTypePage