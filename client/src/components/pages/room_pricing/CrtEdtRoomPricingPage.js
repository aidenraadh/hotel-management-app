import { useCallback, useEffect, useReducer, useState } from 'react'
import {api, errorHandler, formatNum} from '../../Utils'
import {SimpleCard} from '../../Cards'
import {Select, TextInputAddon, Checkbox} from '../../Forms'
import {Grid} from '../../Layouts'
import { Button } from '../../Buttons'

function CrtEdtRoomPricingPage({user}){
    const [roomTypes, setRoomTypes] = useState(undefined)
    const [guestTypes, setGuestTypes] = useState(undefined)
    const [roomTypeId, setRoomTypeId] = useState('')
    const [guestTypeId, setGuestTypeId] = useState('')
    const [guestTypePrices, dispatchGuestTypePrices] = useReducer(guestTypePricesReducer, [])

    const getRoomTypes = useCallback((actionType) => {                
        api.get(`/room-types?get=id,name`)
        .then(response => {
            setRoomTypes(response.data.roomTypes)
            setRoomTypeId(
                response.data.roomTypes[0] ? response.data.roomTypes[0].id : ''
            )            
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [])

    const getGuestTypes = useCallback((actionType) => {                
        api.get(`/guest-types?get=id,name`)
        .then(response => {
            setGuestTypes(response.data.guestTypes)
            setGuestTypeId(
                response.data.guestTypes[0] ? response.data.guestTypes[0].id : ''
            )
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [])    

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

    useEffect(() => {
        console.log(guestTypePrices)
    }, [guestTypePrices])

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
                            onClick: () => {dispatchGuestTypePrices({
                                type: 'addGuestType', payload: {
                                    guestTypeId: guestTypeId
                                }
                            })}
                        }}/>
                    </div>                  
                ]}/>
                <GuestTypePrices
                    guestTypePrices={guestTypePrices} 
                    dispatchGuestTypePrices={dispatchGuestTypePrices}
                    guestTypes={guestTypes}
                />
            </>}
        />
    </>)
}

const GuestTypePrices = ({guestTypePrices, dispatchGuestTypePrices, guestTypes}) => {
    const dayNames = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
        'saturday', 'sunday'
    ]

    return guestTypePrices.map((guestTypePrice, guestTypeindex) => {
        // Get the guest type name
        const guestTypeName = guestTypes.find(guestType => (
            guestTypePrice.guestTypeId === parseInt(guestType.id)
        )).name
        return ( 
            <div key={guestTypeindex}>
                <div className='flex-row items-center content-space-between text-blue' style={{backgroundColor: '#E1F0FF', borderRadius: '0.55rem', padding: '1rem', margin: '2rem 0 2rem'}}>
                    <span className='flex-row items-center text-medium'>
                        {guestTypeName}                      
                    </span>
                    <button type="button" className='text-red' onClick={() => {dispatchGuestTypePrices({
                        type: 'removeGuestType', payload: {guestTypeindex: guestTypeindex}
                    })}}>
                        - Remove
                    </button>                    
                </div>
                {guestTypePrice.prices.map((price, priceIndex) => (
                    <div key={priceIndex}>
                        <TextInputAddon addon={'Price'} containerAttr={{style: {marginTop: '1.6rem'}}} formAttr={{
                            value: formatNum(price.amount),
                            onChange: (e) => {
                                dispatchGuestTypePrices({type: 'updatePrice', payload: {
                                        guestTypeindex: guestTypeindex, priceIndex: priceIndex, 
                                        amount: e.target.value
                                    }                                    
                                })
                            }
                        }}/>
                        <div className='flex-row items-center wrap'>
                            {dayNames.map((day, dayIndex) => (
                                <Checkbox
                                    value={day} key={dayIndex} classes={'text-capitalize'} 
                                    containerAttr={{style: {width: '25%', marginTop: '0.6rem'}}}
                                    formAttr={{
                                        checked: (price.appliedDays.includes(day) ? true : false),
                                        onChange: (e) => {dispatchGuestTypePrices({
                                            type: 'addAppliedDay',
                                            payload: {
                                                guestTypeindex: guestTypeindex,
                                                priceIndex: priceIndex,
                                                checkbox: e.target
                                            }
                                        })}
                                    }}
                                />                            
                            ))}
                        </div>
                    </div>
                ))}
                <hr style={{margin: '1.6rem 0'}}/>
                <button type="button" className='text-blue block' style={{margin: '0 auto'}}
                onClick={() => {dispatchGuestTypePrices({
                    type: 'addPrice', payload: {guestTypeindex: guestTypeindex}
                })}}>
                    + Add price
                </button>                  
            </div>
        )
    })
}

const guestTypePricesReducer = (state, action) => {
    const {type, payload} = action
    switch (type) {
        case 'addGuestType': return (() => {
            let guestTypes = [...state]
            const isGuestTypeExist = guestTypes.find(guestType => (
                guestType.guestTypeId === parseInt(payload.guestTypeId)
            ))
            if(isGuestTypeExist){
                return guestTypes
            }
            else{
                return [...guestTypes, {
                    guestTypeId: parseInt(payload.guestTypeId),
                    prices: []
                }]
            }
        })();
        case 'removeGuestType': return (() => {
            let guestTypes = [...state]
            // Remove the guest type
            guestTypes.splice(payload.guestTypeindex, 1)
            return guestTypes 
        })();
        case 'addPrice': return (() => {
            let guestTypes = [...state]
            // Add new price
            const newPrices = [
                ...guestTypes[payload.guestTypeindex].prices, {
                amount: 0, appliedDays: []
            }]
            // Update the guest type
            guestTypes[payload.guestTypeindex] = {
                ...guestTypes[payload.guestTypeindex], prices: newPrices
            }
            return guestTypes            
        })();
        case 'updatePrice': return (() => {
            let guestTypes = [...state]
            // Get the prices
            const newPrices = [...guestTypes[payload.guestTypeindex].prices]
            // Update the price
            newPrices[payload.priceIndex].amount = parseInt(formatNum(payload.amount, true))
            // Update the guest type
            guestTypes[payload.guestTypeindex] = {
                ...guestTypes[payload.guestTypeindex], 
                prices: newPrices
            }
            return guestTypes            
        })();
        case 'removePrice': return (() => {
            let guestTypes = [...state]
            // Remove the prices
            const newPrices = [...guestTypes[payload.guestTypeindex].prices]
            newPrices.splice(payload.priceIndex, 1)      
            // Update the guest type
            guestTypes[payload.guestTypeindex] = {
                ...guestTypes[payload.guestTypeindex], 
                prices: newPrices
            }
            return guestTypes
        })();
        case 'addAppliedDay': return (() => {
            let guestTypes = [...state]
            // Get the prices
            let newPrices = []
            guestTypes[payload.guestTypeindex].prices.forEach((price, priceIndex, arr) => {
                newPrices.push({...price})
                const dayIndex = price.appliedDays.indexOf(payload.checkbox.value)
                if(priceIndex === parseInt(payload.priceIndex)){
                    // Add the day to the price
                    if(payload.checkbox.checked === true && dayIndex === -1){
                        newPrices[priceIndex].appliedDays = [
                            ...newPrices[priceIndex].appliedDays, payload.checkbox.value
                        ]
                    }
                    // Remove the day to the price
                    else{
                        if(dayIndex !== -1){
                            console.log('removed 1')
                            newPrices[priceIndex].appliedDays.splice(dayIndex, 1)
                        }
                    }
                }
                // Remove added day from the price
                else{
                    if(dayIndex !== -1){
                        newPrices[priceIndex].appliedDays.splice(dayIndex, 1)
                    }
                }
            })
            // Update the prices
            guestTypes[payload.guestTypeindex] = {
                ...guestTypes[payload.guestTypeindex],
                prices: newPrices
            }
            return guestTypes
        })();
        default: throw new Error()
    }
}

export default CrtEdtRoomPricingPage