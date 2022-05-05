import { useCallback, useEffect, useReducer, useState } from 'react'

import { ACTIONS, FILTER_ACTIONS, filterReducer, getFilters } from '../../reducers/GuestTypeReducer'
import { Button } from '../Buttons'

import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal, ConfirmPopup } from '../Windows'
import { api, errorHandler, getQueryString, formatNum, keyHandler } from '../Utils'
import { Grid } from '../Layouts'
import { Select, TextInput } from '../Forms'

function GuestTypePage({room, dispatchRoom, user}){
    const [disableBtn , setDisableBtn] = useState(false)
    // Filter guest types
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters())
    const [filterModalShown, setFilterModalShown] = useState(false)
    // Create / edit guest type
    const [roomIndex, setGuestTypeIndex] = useState('')
    const [name, setName] = useState('')
    const [roomPrice, setRoomPrice] = useState('')
    const [makeGuestTypeMdlHeading, setMakeGuestTypeMdlHeading] = useState('')
    const [makeGuestTypeMdlShown, setMakeGuestTypeMdlShown] = useState(false)
    /* Delete guest type */
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
        // When the guest type is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)  

        if(room.initialLoad === false){
            setDisableBtn(true)
        }                  
        api.get(`/rooms${getQueryString(filters)}`)
        .then(response => {
            const responseData = response.data
            setDisableBtn(false)
            setFilterModalShown(false)
            dispatchFilters({type: FILTER_ACTIONS.RESET, payload: {
                filters: responseData.filters,
            }})
            dispatchRoom({type: actionType, payload: {
                rooms: responseData.rooms,
                filters: responseData.filters
            }})
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [filters, room.initialLoad, dispatchRoom])

    const createRoom = useCallback(() => {
        setGuestTypeIndex('')
        setName('')
        setRoomPrice('')
        setMakeGuestTypeMdlHeading('Create Guest Type')
        setMakeGuestTypeMdlShown(true)        
    }, [])

    const storeRoom = useCallback(() => {
        // setDisableBtn(true)

        // api.post(`/rooms`, {
        //     name: name, roomPrice: roomPrice
        // })
        // .then(response => {
        //     setDisableBtn(false)
        //     setMakeGuestTypeMdlShown(false)                
        //     dispatchRoom({type: ACTIONS.PREPEND, payload: {
        //         rooms: response.data.room,
        //     }})
        // })
        // .catch(err => {
        //     errorHandler(err, {'400': () => {
        //         setDisableBtn(false)
        //         setErrPopupShown(true)
        //         setErrPopupMsg(err.response.data.message)                   
        //     }})
        // })
    }, [dispatchRoom, name, roomPrice])

    const editRoom = useCallback((index) => {
        // const targetGuestType = room.rooms[index] // Get the guest type
        // setGuestTypeIndex(index)
        // setName(targetGuestType.name)
        // setRoomPrice(targetGuestType.room_price)
        // setMakeGuestTypeMdlHeading('Edit Guest Type')
        // setMakeGuestTypeMdlShown(true)
    }, [room.rooms])

    const updateRoom = useCallback(() => {
        // const targetGuestType = room.rooms[roomIndex] // Get the guest type
        // setDisableBtn(true)

        // api.put(`/guest-types/${targetGuestType.id}`, {
        //     name: name, roomPrice: roomPrice
        // })
        // .then(response => {
        //     setDisableBtn(false)
        //     setMakeGuestTypeMdlShown(false)      
        //     setSuccPopupMsg(response.data.message)
        //     setSuccPopupShown(true)                         
        //     dispatchRoom({type: ACTIONS.REPLACE, payload: {
        //         room: response.data.room,
        //         index: roomIndex
        //     }})
        // })
        // .catch(err => {
        //     errorHandler(err, {'400': () => {
        //         setDisableBtn(false)
        //         setErrPopupShown(true)
        //         setErrPopupMsg(err.response.data.message)                   
        //     }})
        // })
    }, [dispatchRoom, name, roomPrice, room.rooms, roomIndex])

    const confirmDeleteGuestType = useCallback(index => {
        // setGuestTypeIndex(index)
        // setPopupShown(true)
    }, [])    

    const deleteRoom = useCallback(() => {
        // const targetGuestType = room.rooms[roomIndex] // Get the guest type
        // setDisableBtn(true)

        // api.delete(`/guest-types/${targetGuestType.id}`)     
        //     .then(response => {   
        //         setDisableBtn(false)
        //         setSuccPopupMsg(response.data.message)
        //         setSuccPopupShown(true)                     
        //         dispatchRoom({
        //             type: ACTIONS.REMOVE, 
        //             payload: {indexes: roomIndex}
        //         })                
        //     })
        //     .catch(err => {
        //         errorHandler(err, {'400': () => {
        //             setDisableBtn(false)
        //             setErrPopupShown(true)
        //             setErrPopupMsg(err.response.data.message)                      
        //         }})               
        //     })          
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
                            placeholder: 'Search guest types', value: filters.name,
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
                    deleteHandler={confirmDeleteGuestType}
                />     
            ]}/>}
        />
        {/* <Modal
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
            shown={makeGuestTypeMdlShown}
            toggleModal={() => {setMakeGuestTypeMdlShown(state => !state)}}
            heading={makeGuestTypeMdlHeading}
            body={<Grid numOfColumns={1} items={[
                <TextInput label={'Guest type name'}
                    formAttr={{
                        value: name, onChange: (e) => {setName(e.target.value)},
                        onKeyUp: (e) => {keyHandler(
                            e, 'Enter', (roomIndex === '' ? storeRoom : updateRoom)
                        )}                          
                    }}
                />,
                <TextInput label={'Room price'}
                    formAttr={{
                        value: formatNum(roomPrice), 
                        onChange: (e) => {setRoomPrice(formatNum(e.target.value, true))},
                        onKeyUp: (e) => {keyHandler(
                            e, 'Enter', (roomIndex === '' ? storeRoom : updateRoom)
                        )}                          
                    }}
                />,                    
            ]}/>}
            footer={<Button text={'Update'} attr={{
                disabled: disableBtn, onClick: () => {
                    // When creating guest type
                    if(roomIndex === ''){ storeRoom() }
                    // When creating guest type
                    else{ updateRoom() }
                }
            }}/>}
        />        
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this guest type?'}
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
        />          */}
    </>
}

const RoomsTable = ({rooms, editHandler, deleteHandler}) => {
    return <Table
        headings={['Name', 'Room Type', 'Pricing Type', 'Actions']}
        body={rooms.map((room, index) => ([
            room.name, 
            room.roomType.name,
            'asd',
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

export default GuestTypePage