import { useCallback, useEffect, useReducer, useState } from 'react'

import { ACTIONS, FILTER_ACTIONS, filterReducer, getFilters } from '../../reducers/RoomReducer'

import { Button } from '../Buttons'
import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal, ConfirmPopup } from '../Windows'
import { api, errorHandler, getQueryString, keyHandler } from '../Utils'
import { Grid } from '../Layouts'
import { Select, TextInput } from '../Forms'

function RoomPage({room, dispatchRoom, user}){
    const [disableBtn , setDisableBtn] = useState(false)
    // Filter rooms
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters())
    const [filterModalShown, setFilterModalShown] = useState(false)
    // Create / edit room
    const [roomIndex, setRoomIndex] = useState('')
    const [name, setName] = useState('')
    const [roomTypeId, setRoomTypeId] = useState('')
    const [makeRoomMdlHeading, setMakeRoomMdlHeading] = useState('')
    const [makeRoomMdlShown, setMakeRoomMdlShown] = useState(false)
    /* Delete room */
    const [popupShown, setPopupShown] = useState(false)    
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')    

    const getRooms = useCallback((actionType) => {
        // Get the queries
        const queries = {...filters}     
        // When the room is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)  

        if(room.initialLoad === false){
            setDisableBtn(true)
        }                  
        api.get(`/rooms${getQueryString(filters)}`)
        .then(response => {
            const responseData = response.data
            const roomPayload = {
                rooms: responseData.rooms,
                filters: responseData.filters                
            }
            // When the room is reset, add room types list
            if(actionType === ACTIONS.RESET){
                roomPayload.roomTypesList = response.data.roomTypesList
            }
            setDisableBtn(false)
            setFilterModalShown(false)
            dispatchFilters({type: FILTER_ACTIONS.RESET, payload: {
                filters: responseData.filters,
            }})
            dispatchRoom({type: actionType, payload: roomPayload})
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [filters, room.initialLoad, dispatchRoom])

    const createRoom = useCallback(() => {
        setRoomIndex('')
        setName('')
        setRoomTypeId('')
        setMakeRoomMdlHeading('Create Room')
        setMakeRoomMdlShown(true)        
    }, [])

    const storeRoom = useCallback(() => {
        setDisableBtn(true)

        api.post(`/rooms`, {
            name: name, roomTypeId: roomTypeId
        })
        .then(response => {
            setDisableBtn(false)
            setMakeRoomMdlShown(false)                
            dispatchRoom({type: ACTIONS.PREPEND, payload: {
                rooms: response.data.room,
            }})
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatchRoom, name, roomTypeId])

    const editRoom = useCallback((index) => {
        const targetRoom = room.rooms[index] // Get the room
        setRoomIndex(index)
        setName(targetRoom.name)
        setRoomTypeId(targetRoom.room_type_id)
        setMakeRoomMdlHeading('Edit Room')
        setMakeRoomMdlShown(true)
    }, [room.rooms])

    const updateRoom = useCallback(() => {
        const targetRoom = room.rooms[roomIndex] // Get the room
        setDisableBtn(true)

        api.put(`/rooms/${targetRoom.id}`, {
            name: name, roomTypeId: roomTypeId
        })
        .then(response => {
            setDisableBtn(false)
            setMakeRoomMdlShown(false)      
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)                         
            dispatchRoom({type: ACTIONS.REPLACE, payload: {
                room: response.data.room,
                index: roomIndex
            }})
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatchRoom, name, room.rooms, roomIndex, roomTypeId])

    const confirmDeleteRoom = useCallback(index => {
        setRoomIndex(index)
        setPopupShown(true)
    }, [])    

    const deleteRoom = useCallback(() => {
        const targetRoom = room.rooms[roomIndex] // Get the room
        setDisableBtn(true)

        api.delete(`/rooms/${targetRoom.id}`)     
            .then(response => {   
                setDisableBtn(false)
                setSuccPopupMsg(response.data.message)
                setSuccPopupShown(true)                     
                dispatchRoom({
                    type: ACTIONS.REMOVE, 
                    payload: {indexes: roomIndex}
                })                
            })
            .catch(err => {
                errorHandler(err, {'400': () => {
                    setDisableBtn(false)
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                      
                }})               
            })          
    }, [dispatchRoom, room.rooms, roomIndex])


    useEffect(() => {       
        if(room.initialLoad === false){
            getRooms(ACTIONS.RESET)
        }
    }, [room.initialLoad, getRooms])
    
    if(room.initialLoad === false){
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
                attr={{onClick: createRoom}}
            />            
        </section>    
        <PlainCard
            body={<Grid numOfColumns={1} items={[
                <section className='flex-row items-center'>
                    <TextInput containerAttr={{style: {width: '100%', marginRight: '1rem'}}}
                        formAttr={{
                            placeholder: 'Search rooms', value: filters.name,
                            onChange: (e) => {dispatchFilters({type: FILTER_ACTIONS.UPDATE, payload: {
                                key: 'name', value: e.target.value
                            }})},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getRooms(ACTIONS.RESET)})}                              
                        }}
                    />
                    <Button text={'Search'} iconName={'search'} iconOnly={'true'} attr={{
                        style: {flexShrink: 0},
                        disabled: disableBtn,
                        onClick: () => {getRooms(ACTIONS.RESET)}
                    }}/>      
                </section>,
                <RoomsTable
                    rooms={room.rooms}
                    editHandler={editRoom}
                    deleteHandler={confirmDeleteRoom}
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
                disabled: disableBtn, onClick: () => {getRooms(ACTIONS.RESET)}
            }}/>}
        />
        <Modal
            size={'sm'} 
            shown={makeRoomMdlShown}
            toggleModal={() => {setMakeRoomMdlShown(state => !state)}}
            heading={makeRoomMdlHeading}
            body={<Grid numOfColumns={1} items={[
                <TextInput label={'Room name'}
                    formAttr={{
                        value: name, onChange: (e) => {setName(e.target.value)},
                        onKeyUp: (e) => {keyHandler(
                            e, 'Enter', (roomIndex === '' ? storeRoom : updateRoom)
                        )}                          
                    }}
                />,       
                <Select label={'Room Type'} 
                    formAttr={{
                        value: roomTypeId,
                        onChange: (e) => {setRoomTypeId(e.target.value)}
                    }}
                    options={room.roomTypesList.map(roomType => ({
                        value: roomType.id, text: roomType.name
                    }))}                        
                />                             
            ]}/>}
            footer={<Button text={'Save changes'} attr={{
                disabled: disableBtn, onClick: () => {
                    // When creating room
                    if(roomIndex === ''){ storeRoom() }
                    // When creating room
                    else{ updateRoom() }
                }
            }}/>}
        />        
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this room?'}
            confirmText={'Remove'}
            cancelText={'Cancel'}
            shown={popupShown} togglePopup={() => {setPopupShown(state => !state)}} 
            confirmCallback={deleteRoom}
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

const RoomsTable = ({rooms, editHandler, deleteHandler}) => {
    return <Table
        headings={['Name', 'Room Type', 'Actions']}
        body={rooms.map((room, index) => ([
            room.name, room.roomType.name,
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

export default RoomPage