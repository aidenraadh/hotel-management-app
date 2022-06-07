import { useCallback, useEffect, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Link} from 'react-router-dom'
import {append, remove, updateFilters, syncFilters, reset} from '../../../features/roomPricingSlice'
import { Button } from '../../Buttons'
import {PlainCard} from '../../Cards'
import Table from '../../Table'
import { Modal, ConfirmPopup } from '../../Windows'
import { api, errorHandler, formatNum, getQueryString, keyHandler } from '../../Utils'
import { Grid } from '../../Layouts'
import { Select, TextInput } from '../../Forms'

function IndexRoomPricingPage({user}){
    const roomPricing = useSelector(state => state.roomPricing)
    const dispatch = useDispatch()

    const [disableBtn , setDisableBtn] = useState(false)
    // Filter room types
    const [filterModalShown, setFilterModalShown] = useState(false)
    // View room pricings
    const [viewedRoomType, setViewedRoomType] = useState('')
    const [viewRoomPricingsMdlShown, setViewRoomPricingsMdlShown] = useState(false)
    /* Delete room type */
    const [roomTypeIndex, setRoomTypeIndex] = useState('')
    const [popupShown, setPopupShown] = useState(false)    
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')    

    const getRoomPricings = useCallback((actionType) => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...roomPricing.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...roomPricing.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)                  
        api.get(`/room-pricings${getQueryString(queries)}`)
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
    }, [roomPricing, dispatch])

    const viewRoomPricing = useCallback(index => {
        setViewedRoomType(roomPricing.roomTypes[index])
        setViewRoomPricingsMdlShown(true)
    }, [roomPricing])    

    const confirmDeleteRoomPricing = useCallback(index => {
        setRoomTypeIndex(index)
        setPopupShown(true)
    }, [])    

    const deleteRoomPricing = useCallback(() => {
        const targetRoomType = roomPricing.roomTypes[roomTypeIndex] // Get the pricing
        setDisableBtn(true)

        api.delete(`/room-pricings/${targetRoomType.id}`)     
            .then(response => {   
                setDisableBtn(false)
                setSuccPopupMsg(response.data.message)
                setSuccPopupShown(true)                     
                dispatch(remove({ indexes: roomTypeIndex }))                
            })
            .catch(err => {
                errorHandler(err, {'400': () => {
                    setDisableBtn(false)
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                      
                }})               
            })          
    }, [dispatch, roomPricing, roomTypeIndex])


    useEffect(() => {       
        if(roomPricing.isLoaded === false){
            getRoomPricings(reset)
        }
    }, [roomPricing, getRoomPricings])

    // When the page is rendered and roomType is already loaded,
    // set the
    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch])     
    
    if(roomPricing.isLoaded === false){
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
            <Link to='/room-pricings/edit'>
                <Button size={'sm'} text={'+ Create'}/>
            </Link>           
        </section>    
        <PlainCard
            body={
                <Grid numOfColumns={1} items={[
                    <section className='flex-row items-center'>
                        <TextInput containerAttr={{style: {width: '100%', marginRight: '1rem'}}}
                            formAttr={{
                                placeholder: 'Search room types', value: roomPricing.filters.name,
                                onChange: e => {dispatch(updateFilters([
                                    {key: 'name', value: e.target.value}
                                ]))},
                                onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getRoomPricings(reset)})}                              
                            }}
                        />
                        <Button text={'Search'} iconName={'search'} iconOnly={'true'} attr={{
                            style: {flexShrink: 0},
                            disabled: disableBtn,
                            onClick: () => {getRoomPricings(reset)}
                        }}/>      
                    </section>,
                    <RoomPricingsTable
                        roomTypes={roomPricing.roomTypes}
                        viewHandler={viewRoomPricing}
                        deleteHandler={confirmDeleteRoomPricing}
                    />,
                    roomPricing.canLoadMore ? 
                    <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '0 auto'}} 
                    onClick={() => {getRoomPricings(append)}} disabled={disableBtn}>
                        Load More
                    </button> : ''                       
                ]}/>
            }
        />
        <Modal
            size={'sm'} 
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
            heading={'Filter Room Type'}
            body={<>
                <Grid numOfColumns={1} items={[
                    <Select label={'Rows shown'} formAttr={{value: roomPricing.filters.limit, onChange: (e) => {
                            dispatch(updateFilters([
                                {key: 'limit', value: e.target.value}
                            ]))
                        }}}
                        options={[{value: 10}, {value: 20}, {value: 30}]}                        
                    />
                ]}/>
            </>}
            footer={<Button text={'Filter'} attr={{
                disabled: disableBtn, onClick: () => {getRoomPricings(reset)}
            }}/>}
        />      
        <Modal
            shown={viewRoomPricingsMdlShown}
            toggleModal={() => {setViewRoomPricingsMdlShown(state => !state)}}
            heading={'Room Pricings Detail'}
            body={<RoomPricingsDetail roomType={viewedRoomType}/>}
        />           
        <ConfirmPopup
            icon={'warning_1'}
            title={'Warning'}
            body={'Are you sure want to remove this room type?'}
            confirmText={'Remove'}
            cancelText={'Cancel'}
            shown={popupShown} togglePopup={() => {setPopupShown(state => !state)}} 
            confirmCallback={deleteRoomPricing}
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

const RoomPricingsTable = ({roomTypes, viewHandler, deleteHandler}) => {
    return <Table
        headings={['No.', 'Room Type', <span className='text-right block'>Actions</span>]}
        body={roomTypes.map((roomType, index) => ([
            (index + 1),
            roomType.name, 
            <span className='flex-row items-center content-end'>
                <Button size={'sm'} type={'light'} text={'View'} attr={{
                    onClick: () => {viewHandler(index)}
                }}/>
                <Button size={'sm'} type={'light'} color={'red'} text={'Delete'} attr={{
                    style: {marginLeft: '1rem'},
                    onClick: () => {deleteHandler(index)}
                }}/>                
            </span>
        ]))}
    />
}

const RoomPricingsDetail = ({roomType}) => {
    if(!roomType){
        return ''
    }
    const dayNames = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
        'saturday', 'sunday'
    ]
    return <Grid numOfColumns={1} classes={'guest-type-room-pricings'} items={roomType.roomPricings.map((roomPricing, roomPricingIdx) => {
        return (<>
            <section key={roomPricingIdx}>
                <h6 className='text-blue text-medium guest-type'>
                    Guest type: <span className='text-capitalize'>{roomPricing.guestType.name}</span>                 
                </h6>           
                <Grid numOfColumns={2} items={dayNames.map((day, dayIndex) => (
                    <p className='flex-row content-space-between text-capitalize day-price' key={dayIndex}>
                        <span>{day}</span>
                        <span>Rp. {formatNum(roomPricing[`price_on_${day}`])}</span>
                    </p>                    
                ))}/>                       
            </section>           
        </>)
    })}
    />
}

export default IndexRoomPricingPage