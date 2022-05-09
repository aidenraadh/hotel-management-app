import { useCallback, useEffect, useReducer, useState } from 'react'

import { ACTIONS, FILTER_ACTIONS, filterReducer, getFilters } from '../../../reducers/RoomPricingReducer'

import {Link} from 'react-router-dom'

import { Button } from '../../Buttons'
import {PlainCard} from '../../Cards'
import Table from '../../Table'
import { Modal, ConfirmPopup } from '../../Windows'
import { api, errorHandler, formatNum, getQueryString, keyHandler } from '../../Utils'
import { Grid } from '../../Layouts'
import { Select, TextInput } from '../../Forms'

function IndexRoomPricingPage({roomPricing, dispatchRoomPricing, user}){
    const [disableBtn , setDisableBtn] = useState(false)
    // Filter room types
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters())
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
        // Get the queries
        const queries = {...filters}     
        // When the room type is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)  

        if(roomPricing.initialLoad === false){
            setDisableBtn(true)
        }                  
        api.get(`/room-pricings${getQueryString(filters)}`)
        .then(response => {
            const responseData = response.data
            setDisableBtn(false)
            setFilterModalShown(false)
            dispatchFilters({type: FILTER_ACTIONS.RESET, payload: {
                filters: responseData.filters,
            }})
            dispatchRoomPricing({type: actionType, payload: {
                roomTypes: responseData.roomTypes,
                filters: responseData.filters
            }})
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [filters, roomPricing.initialLoad, dispatchRoomPricing])

    const viewRoomPricing = useCallback(index => {
        setViewedRoomType(roomPricing.roomTypes[index])
        setViewRoomPricingsMdlShown(true)
    }, [roomPricing.roomTypes])    

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
                dispatchRoomPricing({
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
    }, [dispatchRoomPricing, roomPricing.roomTypes, roomTypeIndex])


    useEffect(() => {       
        if(roomPricing.initialLoad === false){
            getRoomPricings(ACTIONS.RESET)
        }
    }, [roomPricing.initialLoad, getRoomPricings])
    
    if(roomPricing.initialLoad === false){
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
            body={<Grid numOfColumns={1} items={[
                <section className='flex-row items-center'>
                    <TextInput containerAttr={{style: {width: '100%', marginRight: '1rem'}}}
                        formAttr={{
                            placeholder: 'Search room types', value: filters.name,
                            onChange: (e) => {dispatchFilters({type: FILTER_ACTIONS.UPDATE, payload: {
                                key: 'name', value: e.target.value
                            }})},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getRoomPricings(ACTIONS.RESET)})}                              
                        }}
                    />
                    <Button text={'Search'} iconName={'search'} iconOnly={'true'} attr={{
                        style: {flexShrink: 0},
                        disabled: disableBtn,
                        onClick: () => {getRoomPricings(ACTIONS.RESET)}
                    }}/>      
                </section>,
                <RoomPricingsTable
                    roomTypes={roomPricing.roomTypes}
                    viewHandler={viewRoomPricing}
                    deleteHandler={confirmDeleteRoomPricing}
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
                disabled: disableBtn, onClick: () => {getRoomPricings(ACTIONS.RESET)}
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
        headings={['Room Type', 'Actions']}
        body={roomTypes.map((roomType, index) => ([
            roomType.name, 
            <>
                <Button size={'sm'} type={'light'} text={'View pricing'} attr={{
                    onClick: () => {viewHandler(index)}
                }}/>
                <Button size={'sm'} type={'light'} color={'red'} text={'Delete'} attr={{
                    style: {marginLeft: '1rem'},
                    onClick: () => {deleteHandler(index)}
                }}/>                
            </>
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
    return <Grid numOfColumns={1} items={roomType.roomPricings.map((roomPricing, roomPricingIdx) => {

        let priceAndDays = {}
        dayNames.forEach(day => {
            const price = roomPricing[`price_on_${day}`].toString()
            if(priceAndDays[price]){
                priceAndDays[price].push(day)
            }
            else{
                priceAndDays[price] = [day]
            }
        })
        const Pricings = Object.keys(priceAndDays).map((price, index) => (
            <div key={index}>
                <div className='flex-row items-center content-space-between'>
                    <span>Price:</span>
                    <span className='text-capitalize'>{'Rp. '+formatNum(price)}</span>
                </div>
                <ul className='text-capitalize flex-row wrap items-center'>
                    {priceAndDays[price].map(day => (
                        <li style={{width: '33%'}}>{day}</li>
                    ))}
                </ul>
            </div>
        ))
        return (
            <div key={roomPricingIdx}>
                <div className='flex-row items-center content-space-between'>
                    <span>Guest type:</span>
                    <span className='text-capitalize'>{roomPricing.guestType.name}</span>
                </div>     
                {Pricings}           
            </div>
        )
    })}
    />
}

export default IndexRoomPricingPage