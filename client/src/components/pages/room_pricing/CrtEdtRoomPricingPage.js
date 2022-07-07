import { useCallback, useEffect, useReducer, useState } from 'react'
import {Link, useParams} from "react-router-dom";
import {api, errorHandler, formatNum} from '../../Utils'
import {SimpleCard} from '../../Cards'
import {Select, TextInput} from '../../Forms'
import {Grid} from '../../Layouts'
import { Button } from '../../Buttons'
import { ConfirmPopup } from '../../Windows'
import SVGIcons from '../../SVGIcons';

function CrtEdtRoomPricingPage({setPageHeading}){
    const {id} = useParams()

    const [disableBtn , setDisableBtn] = useState(false)
    const [roomTypes, setRoomTypes] = useState(undefined)
    const [guestTypes, setGuestTypes] = useState(undefined)
    const [roomTypeId, setRoomTypeId] = useState('')
    const [guestTypeId, setGuestTypeId] = useState('')
    const [roomPricings, dispatchRoomPricings] = useReducer(RoomPricingsReducer, [])
    const [deletedRoomPricingIds, setDeletedRoomPricingIds] = useState([])
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')      
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')       
    // Get all data for creating room pricing
    const initCreateRoomPricing = useCallback(() => {
        api.get(`/room-pricings/create`)
        .then(response => {
            const responseData = response.data
            // When there are no room types or guest types
            if(responseData.roomTypes.length === 0 || responseData.guestTypes.length === 0){
                alert("You don't have any room types or guest types yet, please create one first.")
            }
            else{
                setRoomTypes(responseData.roomTypes)
                setRoomTypeId(responseData.roomTypes[0].id)
                setGuestTypes(responseData.guestTypes)
                setGuestTypeId(responseData.guestTypes[0].id)
            }
        })
        .catch(error => {
            errorHandler(error)
        })         
    }, [])  
    // Get all data for editing room pricing
    const initEditRoomPricing = useCallback(() => {
        api.get(`/room-pricings/edit/${id}`)
        .then(response => {
            const responseData = response.data
            // When the room pricing for this room type is not exist
            if(!responseData.roomType){
                alert("The room pricings for this room type is not exist.")
            }
            // When there are no room types or guest types
            if(responseData.roomTypes.length === 0 || responseData.guestTypes.length === 0){
                alert("You don't have any room types or guest types yet, please create one first.")
            }
            else{
                dispatchRoomPricings({type: 'fillGuestTypes', payload: {
                    roomPricings: responseData.roomType.roomPricings
                }})
                setRoomTypes(responseData.roomTypes)
                setRoomTypeId(responseData.roomType.id)
                setGuestTypes(responseData.guestTypes)
                setGuestTypeId(responseData.guestTypes[0].id)
            }
        })
        .catch(error => {
            errorHandler(error)
        })         
    }, [])      

    const storeRoomPricings = useCallback(() => {
        setDisableBtn(true)
        api.post(`/room-pricings`, {
            storeRoomTypeId: roomTypeId,
            storeRoomPricings: roomPricings
        })
        .then(response => {
            setDisableBtn(true)
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)
        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {
                '400': () => {
                    setErrPopupMsg(error.response.data.message)
                    setErrPopupShown(true)
                }
            })
        })        
    }, [roomTypeId, roomPricings])

    const updateRoomPricings = useCallback(() => {
        setDisableBtn(true)
        api.put(`/room-pricings/${id}`, {
            updateRoomPricings: roomPricings,
            deletedRoomPricingIds: deletedRoomPricingIds
        })
        .then(response => {
            setDisableBtn(true)
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)
        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {
                '400': () => {
                    setErrPopupMsg(error.response.data.message)
                    setErrPopupShown(true)
                }
            })
        })        
    }, [roomTypeId, roomPricings])    

    useEffect(() => {
        if(roomTypes === undefined || guestTypes === undefined){
            // When id is existed, prepare for editing room pricing
            if(id){ initEditRoomPricing() }
            else{ initCreateRoomPricing() }
        }
    }, [roomTypes, guestTypes])  

    useEffect(() => {
        setPageHeading({title: 'Room Pricings', icon: 'sale_2'})
    }, [])    

    if(roomTypes === undefined || guestTypes === undefined){
        return 'Loading ...'
    }
    return (<>
        <SimpleCard
            heading={
                <span className='flex-row items-center'>
                    <Link to={'/room-pricings'} className={'flex-row items-center'}>
                        <SVGIcons name={'angle_left'} color={'blue'} attr={{style: {fontSize: '2.6rem'}}}/>
                    </Link>
                    {`${id ? 'Edit' : 'Create'} Room Pricing`}
                </span>
            }
            body={<>
                <Grid numOfColumns={2} items={[
                    <Select label={'Room type'} 
                        formAttr={{
                            value: roomTypeId, onChange: (e) => {setRoomTypeId(e.target.value)},
                            disabled: id ? true : false,
                        }}
                        options={roomTypes.map(roomType => ({
                            value: roomType.id, text: roomType.name
                        }))}
                    />,
                    <div className='flex-row items-end'>
                        <Select label={'Guest type'} containerAttr={{style: {width: '100%'}}}
                            formAttr={{
                                value: guestTypeId, onChange: (e) => {setGuestTypeId(e.target.value)}
                            }}
                            options={guestTypes.map(guestType => ({
                                value: guestType.id, text: guestType.name
                            }))}
                        />
                        <Button size={'md'} text={'+ Add'} attr={{
                            style: {flexShrink: 0, marginLeft: '2rem'},
                            onClick: () => {dispatchRoomPricings({
                                type: 'addGuestType', payload: {
                                    guestTypeId: guestTypeId
                                }
                            })}
                        }}/>
                    </div>                  
                ]}/>
                <RoomPricings
                    roomPricings={roomPricings} 
                    dispatchRoomPricings={dispatchRoomPricings}
                    setDeletedRoomPricingIds={setDeletedRoomPricingIds}
                    guestTypes={guestTypes}
                />
            </>}
            footer={
                <Button size={'md'} text={'Save changes'} attr={{
                    disabled: disableBtn,
                    onClick: id ? updateRoomPricings : storeRoomPricings
                }}/>
            }
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
            confirmCallback={() => {
                const host = window.location.origin
                window.location.href = `${host}/room-pricings`                 
            }}
        />         
    </>)
}

const dayNames = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
    'saturday', 'sunday'
]

const RoomPricings = ({roomPricings, dispatchRoomPricings, setDeletedRoomPricingIds, guestTypes}) => {
    return roomPricings.map((roomPricing, index) => {
        // Get the guest type name
        const guestTypeName = guestTypes.find(guestType => (
            roomPricing.guestTypeId === parseInt(guestType.id)
        )).name
        return ( 
            <section key={index}>
                <header className='flex-row items-center content-space-between text-blue' style={{backgroundColor: '#E1F0FF', borderRadius: '0.55rem', padding: '1rem', margin: '2rem 0 1rem'}}>
                    <h6 className='flex-row items-center text-medium' style={{fontSize: '1.44rem'}}>
                        {guestTypeName}                      
                    </h6>
                    <button type="button" className='text-red text-medium' style={{fontSize: '1.44rem'}}
                    onClick={() => {
                        dispatchRoomPricings({type: 'removeGuestType', payload: {index: index}})
                        // When there is room pricing's ID, store the ID to deletedRoomPricingIds
                        if(roomPricing.id){
                            setDeletedRoomPricingIds(state => [...state, roomPricing.id])
                        }
                    }}>
                        - Remove
                    </button>                    
                </header>
                <Grid numOfColumns={4} items={dayNames.map(day => (
                    <TextInput 
                        label={<span className='text-capitalize'>{day}</span>}
                        formAttr={{
                            pattern: '[0-9]*', inputMode: 'numeric',
                            value: formatNum(
                                roomPricing[`priceOn${day[0].toUpperCase() + day.slice(1)}`]
                            ),
                            onChange: (e) => {dispatchRoomPricings({type: 'updatePrice', payload: {
                                index: index,
                                amount: e.target.value,
                                day: day
                            }})}
                        }}
                    /> 
                ))}/>             
            </section>
        )
    })
}

const RoomPricingsReducer = (state, action) => {
    const {type, payload} = action
    switch (type) {
        case 'addGuestType': return (() => {
            let roomPricings = [...state]
            const isGuestTypeExist = roomPricings.find(roomPricing => (
                roomPricing.guestTypeId === parseInt(payload.guestTypeId)
            ))
            if(isGuestTypeExist){
                return state
            }
            else{
                const newGuestType = {
                    id: '',
                    guestTypeId: parseInt(payload.guestTypeId),
                    isEdited: false,
                }
                dayNames.forEach(day => {
                    const capitalDayName = day[0].toUpperCase() + day.slice(1)
                    newGuestType[`priceOn${capitalDayName}`] = 0
                })
                return [...roomPricings, {
                    ...newGuestType
                }]
            }
        })();
        case 'fillGuestTypes': return (() => {
            return payload.roomPricings.map(roomPricing => ({
                id: parseInt(roomPricing.id),
                guestTypeId: parseInt(roomPricing.guestType.id),
                priceOnFriday: roomPricing.price_on_friday,
                priceOnMonday: roomPricing.price_on_friday,
                priceOnSaturday: roomPricing.price_on_friday,
                priceOnSunday: roomPricing.price_on_friday,
                priceOnThursday: roomPricing.price_on_friday,
                priceOnTuesday: roomPricing.price_on_friday,
                priceOnWednesday: roomPricing.price_on_friday,   
                isEdited: false,         
            }))
        })();
        case 'removeGuestType': return (() => {
            let roomPricings = [...state]
            // Remove the guest type
            roomPricings.splice(payload.index, 1)
            return roomPricings 
        })();
        case 'updatePrice': return (() => {
            let roomPricings = [...state]
            // Update the price
            const capitalDayName = payload.day[0].toUpperCase() + payload.day.slice(1)
            roomPricings[payload.index][`priceOn${capitalDayName}`] = parseInt(
                formatNum(payload.amount, true)
            )
            roomPricings[payload.index].isEdited = true
            return roomPricings            
        })();
         default: throw new Error()
    }
}

export default CrtEdtRoomPricingPage