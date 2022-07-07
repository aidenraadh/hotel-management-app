import { useCallback, useEffect, useReducer, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'

import {append, prepend, replace, remove, updateFilters, syncFilters, reset} from '../../features/roomTypeSlice'
import { Button } from '../Buttons'
import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal, ConfirmPopup } from '../Windows'
import { api, errorHandler, getQueryString, keyHandler } from '../Utils'
import { Grid } from '../Layouts'
import { Checkbox, Select, TextInput } from '../Forms'
import { Dropdown, Label, Separator } from '../Misc'
import SVGIcons from '../SVGIcons'

function RoomTypePage({user, setPageHeading}){
    const roomType = useSelector(state => state.roomType)
    const dispatch = useDispatch()

    const [disableBtn , setDisableBtn] = useState(false)
    // Filter room types
    const [filterModalShown, setFilterModalShown] = useState(false)
    // Create / edit room type
    const [roomTypeIndex, setRoomTypeIndex] = useState('')
    const [name, setName] = useState('')
    const [makeRoomTypeMdlheading, setMakeRoomTypeMdlheading] = useState('')
    const [makeRoomTypeMdlShown, setMakeRoomTypeMdlShown] = useState(false)
    const [editRoomSrvcsMdlShown, setEditRoomSrvcsMdlShown] = useState(false)
    const [addRoomSrvcsMdlShown, setAddRoomSrvcsMdlShown] = useState(false)
    /* Room services */
    const [searchedRoomServices, setSearchedRoomServices] = useState([])
    const [addedRoomServices, dispatchAddedRoomServices] = useReducer(addedRoomServiceReducer, [])
    const [rmTypeRmServiceIds, dispatchRmTypeRmServiceIds] = useReducer(rmTypeRmServiceReducer, [])
    const [roomServiceName, setRoomServiceName] = useState('')
    /* Delete room type */
    const [popupShown, setPopupShown] = useState(false)    
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')    

    const getRoomTypes = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...roomType.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...roomType.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)                
        api.get(`/room-types${getQueryString(queries)}`)
        .then(response => {
            const responseData = response.data
            setDisableBtn(false)
            setFilterModalShown(false)
            dispatch(actionType({
                roomTypes: responseData.roomTypes,
                filters: responseData.filters
            }))
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [roomType, dispatch])

    const createRoomType = useCallback(() => {
        setRoomTypeIndex('')
        setName('')
        setMakeRoomTypeMdlheading('Create Room Type')
        setMakeRoomTypeMdlShown(true)        
    }, [])

    const storeRoomType = useCallback(() => {
        setDisableBtn(true)

        api.post(`/room-types`, {
            name: name,
        })
        .then(response => {
            setDisableBtn(false)
            setMakeRoomTypeMdlShown(false)             
            dispatch(prepend({
                roomTypes: response.data.roomType,                
            }))               
        })
        .catch(err => {
            setDisableBtn(false)
            errorHandler(err, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatch, name])

    const editRoomType = useCallback((index) => {
        const targetRoomType = roomType.roomTypes[index] // Get the room type
        setRoomTypeIndex(index)
        setName(targetRoomType.name)
        setMakeRoomTypeMdlheading('Edit Room Type')
        setMakeRoomTypeMdlShown(true)
    }, [roomType.roomTypes])

    const searchRoomServices = useCallback(() => {
        // Get the target room type
        const targetRoomType = roomType.roomTypes[roomTypeIndex]
        setDisableBtn(true)                
        api.get(`/room-services?not_for_room_type=${targetRoomType.id}&name=${roomServiceName}&limit=30&offset=0`)
            .then(response => {
                setDisableBtn(false)  
                setSearchedRoomServices(response.data.roomServices)
            })
            .catch(error => {
                setDisableBtn(false)
                errorHandler(error)
            })
    }, [roomType.roomTypes, roomTypeIndex, roomServiceName])

    const editRoomServices = useCallback(index => {
        setRoomTypeIndex(index)
        dispatchRmTypeRmServiceIds({type: 'empty'})
        setEditRoomSrvcsMdlShown(true)
    }, [roomType.roomTypes])

    const addRoomServices = useCallback(index => {
        setRoomTypeIndex(index) 
        setSearchedRoomServices([])    
        dispatchAddedRoomServices({type: 'empty'})
        setAddRoomSrvcsMdlShown(true)
    }, [roomTypeIndex])

    const storeRoomServices = useCallback(() => {
        const targetRoomType = roomType.roomTypes[roomTypeIndex]
        const roomServiceIds = addedRoomServices.map(roomService => roomService.id)
        setDisableBtn(true)
        api.post(`/room-types/${targetRoomType.id}/store-room-services`, {
            roomServiceIds: roomServiceIds,
        })
            .then(response => {
                setDisableBtn(false)
                setAddRoomSrvcsMdlShown(false)      
                setSuccPopupMsg(response.data.message)
                setSuccPopupShown(true)                         
                dispatch(replace({
                    roomType: response.data.roomType,
                    index: roomTypeIndex                
                }))
            })
            .catch(err => {
                setDisableBtn(false)
                errorHandler(err, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                   
                }})
            })        
    }, [roomTypeIndex, addedRoomServices, roomType.roomTypes])    

    const deleteRoomServices = useCallback(() => {
        const targetRoomType = roomType.roomTypes[roomTypeIndex]
        setDisableBtn(true)
        api.post(`/room-types/${targetRoomType.id}/delete-room-services`, {
            roomTypeRoomServiceIds: rmTypeRmServiceIds,
        })
            .then(response => {
                setDisableBtn(false)
                setEditRoomSrvcsMdlShown(false)      
                setSuccPopupMsg(response.data.message)
                setSuccPopupShown(true)                         
                dispatch(replace({
                    roomType: response.data.roomType,
                    index: roomTypeIndex                
                }))
            })
            .catch(err => {
                setDisableBtn(false)
                errorHandler(err, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                   
                }})
            })         
    }, [roomTypeIndex, rmTypeRmServiceIds, roomType.roomTypes])       

    const updateRoomType = useCallback(() => {
        const targetRoomType = roomType.roomTypes[roomTypeIndex] // Get the room type
        setDisableBtn(true)

        api.put(`/room-types/${targetRoomType.id}`, {
            name: name,
        })
        .then(response => {
            setDisableBtn(false)
            setMakeRoomTypeMdlShown(false)      
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)                         
            dispatch(replace({
                roomType: response.data.roomType,
                index: roomTypeIndex                
            }))
        })
        .catch(err => {
            setDisableBtn(false)
            errorHandler(err, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatch, name, roomType.roomTypes, roomTypeIndex])

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
                dispatch(remove( {indexes: roomTypeIndex} ))                
            })
            .catch(err => {
                setDisableBtn(false)
                errorHandler(err, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                      
                }})               
            })          
    }, [dispatch, roomType.roomTypes, roomTypeIndex])


    useEffect(() => {       
        if(roomType.isLoaded === false){
            getRoomTypes(reset)
        }
    }, [roomType.isLoaded, getRoomTypes])

    // When the page is rendered and roomType is already loaded,
    // set the
    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch]) 

    useEffect(() => {
        setPageHeading({title: 'Room Types', icon: 'couch'})
    }, [])       
    
    if(roomType.isLoaded === false){
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
                    <TextInput containerAttr={{style: {width: '100%', marginRight: '1.6rem'}}}
                        formAttr={{
                            placeholder: 'Search room types', value: roomType.filters.name,
                            onChange: (e) => {dispatch(updateFilters([
                                {key: 'name', value: e.target.value}
                            ]))},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getRoomTypes(reset)})}                              
                        }}
                    />
                    <Button text={'Search'} iconName={'search'} iconOnly={'true'} attr={{
                        style: {flexShrink: 0},
                        disabled: disableBtn,
                        onClick: () => {getRoomTypes(reset)}
                    }}/>      
                </section>,
                <RoomTypesTable
                    roomTypes={roomType.roomTypes}
                    editRoomServices={editRoomServices}
                    addRoomServices={addRoomServices}
                    editHandler={editRoomType}
                    deleteHandler={confirmDeleteRoomType}
                />,
                roomType.canLoadMore ? 
                <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '0 auto'}} 
                onClick={() => {getRoomTypes(append)}} disabled={disableBtn}>
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
                    <Select label={'Rows shown'} formAttr={{value: roomType.filters.limit, onChange: (e) => {
                            dispatch(updateFilters( [{key: 'limit', value: e.target.value}] ))
                        }}}
                        options={[{value: 10}, {value: 20}, {value: 30}]}                        
                    />
                ]}/>
            </>}
            footer={<Button text={'Filter'} attr={{
                disabled: disableBtn, onClick: () => {getRoomTypes(reset)}
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
            ]}/>}
            footer={<Button text={'Save changes'} attr={{
                disabled: disableBtn, onClick: () => {
                    // When creating room type
                    if(roomTypeIndex === ''){ storeRoomType() }
                    // When creating room type
                    else{ updateRoomType() }
                }
            }}/>}
        />   
        <Modal
            shown={addRoomSrvcsMdlShown}
            toggleModal={() => {setAddRoomSrvcsMdlShown(state => !state)}}
            heading={'Add Room Services'}
            body={<>
                <section className='flex-row items-center'>
                    <TextInput 
                        size='sm' containerAttr={{style: {width: '100%', marginRight: '1.6rem'}}} formAttr={{
                            value: roomServiceName,
                            placeholder: 'Search room services',
                            onKeyUp: (e) => {keyHandler(e, 'Enter', searchRoomServices)},
                            onChange: (e) => {setRoomServiceName(e.target.value)}
                        }}
                    />
                    <Button text='search' size='sm' iconName='search' iconOnly={true} attr={{
                        disabled: disableBtn,
                        style: {flexShrink: 0},
                        onClick: searchRoomServices
                    }}/>
                </section>
                <p className='flex-row items-center wrap' style={{fontSize: '1.4rem'}}>
                    {addedRoomServices.map((roomService, index) => (
                        <Label key={index} attr={{style: {margin: '1.2rem 1.2rem 0 0'}}}
                            text={<>
                                {roomService.name}
                                <button className='text-red text-medium' type="button" style={{marginLeft: '0.8rem'}}
                                onClick={() => {dispatchAddedRoomServices({type: 'remove', payload: index})}}>
                                    -
                                </button>
                            </>}
                        />
                    ))}
                </p>
                <Separator attr={{style: {margin: '1.16rem 0'}}}/>                
                <p className='text-dark-50' style={{fontSize: '1.4rem'}}>
                    Room service shown below is the ones is not added yet to this room type. Max shown 30
                </p>
                <Separator attr={{style: {marginTop: '1.16rem'}}}/>
                <Table headings={['No.', 'Name', 'Actions']} body={searchedRoomServices.map((roomService, index) => ([
                    (index + 1),
                    roomService.name,
                    <Button size={'sm'} text={'+ Add'} attr={{
                        onClick: () => {dispatchAddedRoomServices({type: 'add', payload: roomService})}
                    }}/>
                ]))}/>
            </>}
            footer={
                <Button text={'Save changes'} attr={{
                    disabled: disableBtn,
                    onClick: storeRoomServices
                }}/>
            }
        />           
        <Modal
            shown={editRoomSrvcsMdlShown}
            toggleModal={() => {setEditRoomSrvcsMdlShown(state => !state)}}
            heading={'Edit Room Services'}
            body={(() => {
                const targetRoomType = roomType.roomTypes[roomTypeIndex]
                if(!targetRoomType || targetRoomType.roomServiceList.length === 0){
                    return 'No room services found.'
                }
                return (<>
                    <section className='flex-row items-center content-end'>
                        <Button size='sm' color='red' text='Remove' attr={{
                            onClick: deleteRoomServices
                        }}/>
                    </section>
                    <Separator attr={{style: {marginTop: '1.2rem'}}}/>
                    <Table headings={['Select', 'Name']}
                        body={targetRoomType.roomServiceList.map(list => ([
                            <Checkbox formAttr={{
                                checked: rmTypeRmServiceIds.includes(list.id.toString()),
                                value: list.id,
                                onChange: (e) => {dispatchRmTypeRmServiceIds({type: 'toggle', payload: e})}
                            }}/>,
                            list.roomService.name
                        ]))}
                    />
                </>)
            })()}
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

const RoomTypesTable = ({roomTypes, editRoomServices, addRoomServices, editHandler, deleteHandler}) => {
    return <Table
        headings={['No.', 'Name', 'Actions']}
        body={roomTypes.map((roomType, index) => ([
            (index + 1),
            roomType.name, 
            <>
                <Dropdown
                    button={{ size: 'sm', type: 'light', text: 'Room services' }}
                    items={[
                        <button type="button" className='items-center' style={{display: 'flex'}} onClick={() => {editRoomServices(index)}}>
                            <SVGIcons name='write' color='blue' attr={{style: {
                                marginRight: '0.74rem', fontSize: '1.74rem',
                            }}}/>
                            Edit room services
                        </button>,
                        <button type="button" className='items-center' style={{display: 'flex'}} onClick={() => {addRoomServices(index)}}>
                            <SVGIcons name='gen035' color='blue' attr={{style: {
                                marginRight: '0.74rem', fontSize: '1.78rem',
                            }}}/>                            
                            Add room services
                        </button>
                    ]}
                />           
                <Button size={'sm'} type={'light'} text={'Edit'} color='purple' attr={{
                    style: {marginLeft: '1rem'},                    
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

const addedRoomServiceReducer = (state, action) => {
    const {type, payload} = {...action}
    switch (type) {
        case 'add':
            // Make sure the room service is not added yet
            const isAdded = state.find(roomService => (
                parseInt(roomService.id) === parseInt(payload.id)
            ))
            if(isAdded){ return state }
            return [...state, payload]

        case 'remove': return (() => {
            let roomServices = [...state]
            roomServices.splice(payload, 1)

            return roomServices            
        })()
        case 'empty':
            return []
        default: throw new Error('Action type not valid')
    }
}

const rmTypeRmServiceReducer = (state, action) => {
    const {type, payload} = {...action}
    switch (type) {
        case 'toggle':
            let rmTypeRmServiceIds = [...state]
            if(rmTypeRmServiceIds.includes(payload.target.value)){
                rmTypeRmServiceIds.splice(
                    rmTypeRmServiceIds.indexOf(payload.target.value), 1
                )
            }
            else{
                rmTypeRmServiceIds.push(payload.target.value)
            }
            return rmTypeRmServiceIds

        case 'empty':
            return []
        default: throw new Error('Action type not valid')
    }
}

export default RoomTypePage