import { useCallback, useEffect, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'

import {append, prepend, replace, remove, updateFilters, syncFilters, reset} from '../../features/roomSlice'
import { Button } from '../Buttons'
import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal, ConfirmPopup } from '../Windows'
import { api, errorHandler, getQueryString, keyHandler } from '../Utils'
import { Grid } from '../Layouts'
import { Select, TextInput } from '../Forms'

function RoomPage({user}){
    const room = useSelector(state => state.room)
    const dispatch = useDispatch()

    const [disableBtn , setDisableBtn] = useState(false)
    // Filter rooms
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

    const getRooms = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...room.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...room.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)
        api.get(`/rooms${getQueryString(queries)}`)
        .then(response => {
            const responseData = response.data
            setDisableBtn(false)
            setFilterModalShown(false)
            dispatch(actionType({
                rooms: responseData.rooms,
                roomTypes: responseData.roomTypes,
                filters: responseData.filters
            }))
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [room, dispatch])

    const createRoom = useCallback(() => {
        setRoomIndex('')
        setName('')
        setRoomTypeId(room.roomTypes[0] ? room.roomTypes[0].id : '')
        setMakeRoomMdlHeading('Create Room')
        setMakeRoomMdlShown(true)        
    }, [room])

    const storeRoom = useCallback(() => {
        setDisableBtn(true)

        api.post(`/rooms`, {
            name: name, roomTypeId: roomTypeId
        })
        .then(response => {
            setDisableBtn(false)
            setMakeRoomMdlShown(false)
            dispatch(prepend({
                rooms: response.data.room
            }))      
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatch, name, roomTypeId])

    const editRoom = useCallback((index) => {
        const targetRoom = room.rooms[index] // Get the room
        setRoomIndex(index)
        setName(targetRoom.name)
        setRoomTypeId(targetRoom.roomType.id)
        setMakeRoomMdlHeading('Edit Room')
        setMakeRoomMdlShown(true)
    }, [room])

    const updateRoom = useCallback(() => {
        console.log(roomTypeId)
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
            dispatch(replace({
                room: response.data.room,
                index: roomIndex
            }))
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatch, name, room, roomIndex, roomTypeId])

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
                dispatch(remove({
                    indexes: roomIndex
                }))                
            })
            .catch(err => {
                errorHandler(err, {'400': () => {
                    setDisableBtn(false)
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                      
                }})               
            })          
    }, [dispatch, room, roomIndex])


    useEffect(() => {       
        if(room.isLoaded === false){
            getRooms(reset)
        }
    }, [room, getRooms])

    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch])     
    
    if(room.isLoaded === false){
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
                            placeholder: 'Search rooms', value: room.filters.name,
                            onChange: (e) => {dispatch(updateFilters([
                                {key: 'name', value: e.target.value}
                            ]))},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getRooms(reset)})}                              
                        }}
                    />
                    <Button text={'Search'} iconName={'search'} iconOnly={'true'} attr={{
                        style: {flexShrink: 0},
                        disabled: disableBtn,
                        onClick: () => {getRooms(reset)}
                    }}/>      
                </section>,
                <RoomsTable
                    rooms={room.rooms}
                    editHandler={editRoom}
                    deleteHandler={confirmDeleteRoom}
                />,
                room.canLoadMore ? 
                <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '0 auto'}} 
                onClick={() => {getRooms(append)}} disabled={disableBtn}>
                    Load More
                </button> : ''                
            ]}/>}
        />
        <Modal
            size={'sm'} 
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
            heading={'Filter Room Type'}
            body={<>
                <Grid numOfColumns={1} items={[
                    <Select label={'Rows shown'} formAttr={{value: room.filters.limit, onChange: (e) => {
                            dispatch(updateFilters([
                                {key: 'limit', value: e.target.value}
                            ]))
                        }}}
                        options={[{value: 10}, {value: 20}, {value: 30}]}                        
                    />
                ]}/>
            </>}
            footer={<Button text={'Filter'} attr={{
                disabled: disableBtn, onClick: () => {getRooms(reset)}
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
                    options={room.roomTypes.map(roomType => ({
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
        headings={['No.', 'Name', 'Room Type', 'Actions']}
        body={rooms.map((room, index) => ([
            (index + 1),
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