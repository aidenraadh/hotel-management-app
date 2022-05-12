import { useCallback, useEffect, useReducer, useState } from 'react'
import {api, errorHandler, formatNum} from '../../Utils'
import {SimpleCard} from '../../Cards'
import {Select, TextInput} from '../../Forms'
import {Grid} from '../../Layouts'
import { Button } from '../../Buttons'
import { ConfirmPopup } from '../../Windows'

function CrtEdtRoomPricingPage({user}){
    const [disableBtn , setDisableBtn] = useState(false)
    const [roomTypes, setRoomTypes] = useState(undefined)
    const [guestTypes, setGuestTypes] = useState(undefined)
    const [roomTypeId, setRoomTypeId] = useState('')
    const [guestTypeId, setGuestTypeId] = useState('')
    const [roomPricings, dispatchRoomPricings] = useReducer(RoomPricingsReducer, [])
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')      
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')       

    const getRoomTypes = useCallback(() => {                
        api.get(`/room-types?get=id,name`)
        .then(response => {
            const responseData = response.data
            setRoomTypes(responseData.roomTypes)
            setRoomTypeId(
                responseData.roomTypes[0] ? responseData.roomTypes[0].id : ''
            )
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [])

    const getGuestTypes = useCallback(() => {                
        api.get(`/guest-types?get=id,name`)
        .then(response => {
            const responseData = response.data
            setGuestTypes(responseData.guestTypes)
            setGuestTypeId(
                responseData.guestTypes[0] ? responseData.guestTypes[0].id : ''
            )
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

    useEffect(() => {
        if(roomTypes === undefined){
            getRoomTypes()
        }
    }, [getRoomTypes, roomTypes])

    useEffect(() => {
        if(guestTypes === undefined){
            getGuestTypes()
        }
    }, [getGuestTypes, guestTypes])

    if(roomTypes === undefined || guestTypes === undefined){
        return 'Loading ...'
    }
    return (<>
        <SimpleCard
            heading={'Create Room Pricing'}
            body={<>
                <Grid numOfColumns={2} items={[
                    <Select label={'Room type'} 
                        formAttr={{
                            value: roomTypeId, onChange: (e) => {setRoomTypeId(e.target.value)}
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
                    guestTypes={guestTypes}
                />
            </>}
            footer={
                <Button size={'md'} text={'Save changes'} attr={{
                    disabled: disableBtn,
                    onClick: storeRoomPricings
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

const RoomPricings = ({roomPricings, dispatchRoomPricings, guestTypes}) => {
    return roomPricings.map((roomPricing, index) => {
        // Get the guest type name
        const guestTypeName = guestTypes.find(guestType => (
            roomPricing.guestTypeId === parseInt(guestType.id)
        )).name
        return ( 
            <div key={index}>
                <div className='flex-row items-center content-space-between text-blue' style={{backgroundColor: '#E1F0FF', borderRadius: '0.55rem', padding: '1rem', margin: '2rem 0 1rem'}}>
                    <span className='flex-row items-center text-medium'>
                        {guestTypeName}                      
                    </span>
                    <button type="button" className='text-red' style={{fontSize: '1.46rem'}}
                    onClick={() => {dispatchRoomPricings({
                        type: 'removeGuestType', payload: {index: index}
                    })}}>
                        - Remove
                    </button>                    
                </div>
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
            </div>
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
                return roomPricings
            }
            else{
                const newGuestType = {guestTypeId: parseInt(payload.guestTypeId)}
                dayNames.forEach(day => {
                    const capitalDayName = day[0].toUpperCase() + day.slice(1)
                    newGuestType[`priceOn${capitalDayName}`] = 0
                })
                return [...roomPricings, {
                    ...newGuestType
                }]
            }
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
            return roomPricings            
        })();
         default: throw new Error()
    }
}

export default CrtEdtRoomPricingPage