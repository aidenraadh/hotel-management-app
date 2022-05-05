import { useCallback, useEffect, useReducer, useState } from 'react'

import { ACTIONS, FILTER_ACTIONS, filterReducer, getFilters } from '../../reducers/GuestTypeReducer'
import { Button } from '../Buttons'

import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal, ConfirmPopup } from '../Windows'
import { api, errorHandler, getQueryString, formatNum, keyHandler } from '../Utils'
import { Grid } from '../Layouts'
import { Select, TextInput } from '../Forms'

function GuestTypePage({guestType, dispatchGuestType, user}){
    const [disableBtn , setDisableBtn] = useState(false)
    // Filter guest types
    const [filters, dispatchFilters] = useReducer(filterReducer, getFilters())
    const [filterModalShown, setFilterModalShown] = useState(false)
    // Create / edit guest type
    const [guestTypeIndex, setGuestTypeIndex] = useState('')
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

    const getGuestTypes = useCallback((actionType) => {
        // Get the queries
        const queries = {...filters}     
        // When the guest type is refreshed, set the offset to 0
        queries.offset = actionType === ACTIONS.RESET ? 0 : (queries.offset + queries.limit)  

        if(guestType.initialLoad === false){
            setDisableBtn(true)
        }                  
        api.get(`/guest-types${getQueryString(filters)}`)
        .then(response => {
            const responseData = response.data
            setDisableBtn(false)
            setFilterModalShown(false)
            dispatchFilters({type: FILTER_ACTIONS.RESET, payload: {
                filters: responseData.filters,
            }})
            dispatchGuestType({type: actionType, payload: {
                guestTypes: responseData.guestTypes,
                filters: responseData.filters
            }})
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [filters, guestType.initialLoad, dispatchGuestType])

    const createGuestType = useCallback(() => {
        setGuestTypeIndex('')
        setName('')
        setRoomPrice('')
        setMakeGuestTypeMdlHeading('Create Guest Type')
        setMakeGuestTypeMdlShown(true)        
    }, [])

    const storeGuestType = useCallback(() => {
        setDisableBtn(true)

        api.post(`/guest-types`, {
            name: name, roomPrice: roomPrice
        })
        .then(response => {
            setDisableBtn(false)
            setMakeGuestTypeMdlShown(false)                
            dispatchGuestType({type: ACTIONS.PREPEND, payload: {
                guestTypes: response.data.guestType,
            }})
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatchGuestType, name, roomPrice])

    const editGuestType = useCallback((index) => {
        const targetGuestType = guestType.guestTypes[index] // Get the guest type
        setGuestTypeIndex(index)
        setName(targetGuestType.name)
        setRoomPrice(targetGuestType.room_price)
        setMakeGuestTypeMdlHeading('Edit Guest Type')
        setMakeGuestTypeMdlShown(true)
    }, [guestType.guestTypes])

    const updateGuestType = useCallback(() => {
        const targetGuestType = guestType.guestTypes[guestTypeIndex] // Get the guest type
        setDisableBtn(true)

        api.put(`/guest-types/${targetGuestType.id}`, {
            name: name, roomPrice: roomPrice
        })
        .then(response => {
            setDisableBtn(false)
            setMakeGuestTypeMdlShown(false)      
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)                         
            dispatchGuestType({type: ACTIONS.REPLACE, payload: {
                guestType: response.data.guestType,
                index: guestTypeIndex
            }})
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatchGuestType, name, roomPrice, guestType.guestTypes, guestTypeIndex])

    const confirmDeleteGuestType = useCallback(index => {
        setGuestTypeIndex(index)
        setPopupShown(true)
    }, [])    

    const deleteGuestType = useCallback(() => {
        const targetGuestType = guestType.guestTypes[guestTypeIndex] // Get the guest type
        setDisableBtn(true)

        api.delete(`/guest-types/${targetGuestType.id}`)     
            .then(response => {   
                setDisableBtn(false)
                setSuccPopupMsg(response.data.message)
                setSuccPopupShown(true)                     
                dispatchGuestType({
                    type: ACTIONS.REMOVE, 
                    payload: {indexes: guestTypeIndex}
                })                
            })
            .catch(err => {
                errorHandler(err, {'400': () => {
                    setDisableBtn(false)
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                      
                }})               
            })          
    }, [dispatchGuestType, guestType.guestTypes, guestTypeIndex])


    useEffect(() => {       
        if(guestType.initialLoad === false){
            getGuestTypes(ACTIONS.RESET)
        }
    }, [guestType.initialLoad, getGuestTypes])
    
    if(guestType.initialLoad === false){
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
                attr={{onClick: createGuestType}}
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
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getGuestTypes(ACTIONS.RESET)})}                              
                        }}
                    />
                    <Button text={'Search'} iconName={'search'} iconOnly={'true'} attr={{
                        style: {flexShrink: 0},
                        disabled: disableBtn,
                        onClick: () => {getGuestTypes(ACTIONS.RESET)}
                    }}/>      
                </section>,
                <GuestTypesTable
                    guestTypes={guestType.guestTypes}
                    editHandler={editGuestType}
                    deleteHandler={confirmDeleteGuestType}
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
                disabled: disableBtn, onClick: () => {getGuestTypes(ACTIONS.RESET)}
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
                            e, 'Enter', (guestTypeIndex === '' ? storeGuestType : updateGuestType)
                        )}                          
                    }}
                />,
                <TextInput label={'Room price'}
                    formAttr={{
                        value: formatNum(roomPrice), 
                        onChange: (e) => {setRoomPrice(formatNum(e.target.value, true))},
                        onKeyUp: (e) => {keyHandler(
                            e, 'Enter', (guestTypeIndex === '' ? storeGuestType : updateGuestType)
                        )}                          
                    }}
                />,                    
            ]}/>}
            footer={<Button text={'Update'} attr={{
                disabled: disableBtn, onClick: () => {
                    // When creating guest type
                    if(guestTypeIndex === ''){ storeGuestType() }
                    // When creating guest type
                    else{ updateGuestType() }
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
            confirmCallback={deleteGuestType}
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

const GuestTypesTable = ({guestTypes, editHandler, deleteHandler}) => {
    return <Table
        headings={['Name', 'Room Price', 'Actions']}
        body={guestTypes.map((guestType, index) => ([
            guestType.name, 
            'Rp. '+(guestType.room_price ? formatNum(guestType.room_price) : 0),
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