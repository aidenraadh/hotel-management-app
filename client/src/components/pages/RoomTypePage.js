import { useCallback, useEffect, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'

import {append, prepend, replace, remove, updateFilters, syncFilters, reset} from '../../features/roomTypeSlice'

import { Button } from '../Buttons'
import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal, ConfirmPopup } from '../Windows'
import { api, errorHandler, getQueryString, keyHandler } from '../Utils'
import { Grid } from '../Layouts'
import { Select, TextInput } from '../Forms'

function RoomTypePage({user}){
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
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
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
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
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
                errorHandler(err, {'400': () => {
                    setDisableBtn(false)
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
                    <TextInput containerAttr={{style: {width: '100%', marginRight: '1rem'}}}
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
        headings={['No.', 'Name', 'Actions']}
        body={roomTypes.map((roomType, index) => ([
            (index + 1),
            roomType.name, 
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