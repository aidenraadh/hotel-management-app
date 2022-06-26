import { useCallback, useEffect, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'

import {append, prepend, replace, remove, updateFilters, syncFilters, reset} from '../../features/roomServiceSlice'
import { Button } from '../Buttons'
import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal, ConfirmPopup } from '../Windows'
import { api, errorHandler, getQueryString, keyHandler } from '../Utils'
import { Grid } from '../Layouts'
import { Select, TextInput } from '../Forms'

function RoomServicePage({user}){
    const roomService = useSelector(state => state.roomService)
    const dispatch = useDispatch()

    const [disableBtn , setDisableBtn] = useState(false)
    // Filter room services
    const [filterModalShown, setFilterModalShown] = useState(false)
    // Create / edit room service
    const [roomServiceIndex, setRoomServiceIndex] = useState('')
    const [name, setName] = useState('')
    const [makeRoomServiceMdlHeading, setMakeRoomServiceMdlHeading] = useState('')
    const [makeRoomServiceMdlShown, setMakeRoomServiceMdlShown] = useState(false)
    /* Delete room service */
    const [popupShown, setPopupShown] = useState(false)    
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')    

    const getRoomServices = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...roomService.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...roomService.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)
        api.get(`/room-services${getQueryString(queries)}`)
        .then(response => {
            const responseData = response.data
            setDisableBtn(false)
            setFilterModalShown(false)
            dispatch(actionType({
                roomServices: responseData.roomServices,
                filters: responseData.filters
            }))
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [roomService, dispatch])

    const createRoomService = useCallback(() => {
        setRoomServiceIndex('')
        setName('')
        setMakeRoomServiceMdlHeading('Create Room Service')
        setMakeRoomServiceMdlShown(true)        
    }, [])

    const storeRoomService = useCallback(() => {
        setDisableBtn(true)

        api.post(`/room-services`, {
            name: name
        })
        .then(response => {
            setDisableBtn(false)
            setMakeRoomServiceMdlShown(false)                
            dispatch(prepend({
                roomServices: response.data.roomService,
            }))  
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatch, name])

    const editRoomService = useCallback((index) => {
        const targetRoomService = roomService.roomServices[index] // Get the room service
        setRoomServiceIndex(index)
        setName(targetRoomService.name)
        setMakeRoomServiceMdlHeading('Edit Room Service')
        setMakeRoomServiceMdlShown(true)
    }, [roomService.roomServices])

    const updateRoomService = useCallback(() => {
        const targetRoomService = roomService.roomServices[roomServiceIndex] // Get the room service
        setDisableBtn(true)

        api.put(`/room-services/${targetRoomService.id}`, {
            name: name
        })
        .then(response => {
            setDisableBtn(false)
            setMakeRoomServiceMdlShown(false)      
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)                         
            dispatch(replace({
                roomService: response.data.roomService,
                index: roomServiceIndex                
            }))
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatch, name, roomService.roomServices, roomServiceIndex])

    const confirmDeleteRoomService = useCallback(index => {
        setRoomServiceIndex(index)
        setPopupShown(true)
    }, [])    

    const deleteRoomService = useCallback(() => {
        const targetRoomService = roomService.roomServices[roomServiceIndex] // Get the room service
        setDisableBtn(true)

        api.delete(`/room-services/${targetRoomService.id}`)     
            .then(response => {   
                setDisableBtn(false)
                setSuccPopupMsg(response.data.message)
                setSuccPopupShown(true)                     
                dispatch(remove( {indexes: roomServiceIndex} ))               
            })
            .catch(err => {
                errorHandler(err, {'400': () => {
                    setDisableBtn(false)
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                      
                }})               
            })          
    }, [dispatch, roomService.roomServices, roomServiceIndex])


    useEffect(() => {       
        if(roomService.isLoaded === false){
            getRoomServices(reset)
        }
    }, [roomService.isLoaded, getRoomServices])

    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch])     
    
    if(roomService.isLoaded === false){
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
                attr={{onClick: createRoomService}}
            />            
        </section>    
        <PlainCard
            body={<Grid numOfColumns={1} items={[
                <section className='flex-row items-center'>
                    <TextInput containerAttr={{style: {width: '100%', marginRight: '1rem'}}}
                        formAttr={{
                            placeholder: 'Search room services', value: roomService.filters.name,
                            onChange: (e) => {dispatch(updateFilters([
                                {key: 'name', value: e.target.value}
                            ]))},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getRoomServices(reset)})}                               
                        }}
                    />
                    <Button text={'Search'} iconName={'search'} iconOnly={'true'} attr={{
                        style: {flexShrink: 0},
                        disabled: disableBtn,
                        onClick: () => {getRoomServices(reset)}
                    }}/>      
                </section>,
                <RoomServicesTable
                    roomServices={roomService.roomServices}
                    editHandler={editRoomService}
                    deleteHandler={confirmDeleteRoomService}
                />,
                roomService.canLoadMore ? 
                <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '0 auto'}} 
                onClick={() => {getRoomServices(append)}} disabled={disableBtn}>
                    Load More
                </button> : ''                  
            ]}/>}
        />
        <Modal
            size={'sm'} 
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
            heading={'Filter Room Service'}
            body={<>
                <Grid numOfColumns={1} items={[
                    <Select label={'Rows shown'} formAttr={{value: roomService.filters.limit, onChange: (e) => {
                            dispatch(updateFilters( [{key: 'limit', value: e.target.value}] ))
                        }}}
                        options={[{value: 10}, {value: 20}, {value: 30}]}                        
                    />
                ]}/>
            </>}
            footer={<Button text={'Filter'} attr={{
                disabled: disableBtn, onClick: () => {getRoomServices(reset)}
            }}/>}
        />
        <Modal
            size={'sm'} 
            shown={makeRoomServiceMdlShown}
            toggleModal={() => {setMakeRoomServiceMdlShown(state => !state)}}
            heading={makeRoomServiceMdlHeading}
            body={<Grid numOfColumns={1} items={[
                <TextInput label={'Room service name'}
                    formAttr={{
                        value: name, onChange: (e) => {setName(e.target.value)},
                        onKeyUp: (e) => {keyHandler(
                            e, 'Enter', (roomServiceIndex === '' ? storeRoomService : updateRoomService)
                        )}                          
                    }}
                />,                   
            ]}/>}
            footer={<Button text={'Save changes'} attr={{
                disabled: disableBtn, onClick: () => {
                    // When creating room service
                    if(roomServiceIndex === ''){ storeRoomService() }
                    // When creating room service
                    else{ updateRoomService() }
                }
            }}/>}
        />        
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this room service?'}
            confirmText={'Remove'}
            cancelText={'Cancel'}
            shown={popupShown} togglePopup={() => {setPopupShown(state => !state)}} 
            confirmCallback={deleteRoomService}
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

const RoomServicesTable = ({roomServices, editHandler, deleteHandler}) => {
    return <Table
        headings={['No.', 'Name', 'Actions']}
        body={roomServices.map((roomService, index) => ([
            (index + 1),
            roomService.name, 
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


export default RoomServicePage