import { useCallback, useEffect, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux'

import {append, prepend, replace, remove, updateFilters, syncFilters, reset} from '../../features/guestTypeSlice'
import { Button } from '../Buttons'
import {PlainCard} from '../Cards'
import Table from '../Table'
import { Modal, ConfirmPopup } from '../Windows'
import { api, errorHandler, getQueryString, keyHandler } from '../Utils'
import { Grid } from '../Layouts'
import { Select, TextInput } from '../Forms'

function GuestTypePage({user, setPageHeading}){
    const guestType = useSelector(state => state.guestType)
    const dispatch = useDispatch()

    const [disableBtn , setDisableBtn] = useState(false)
    // Filter guest types
    const [filterModalShown, setFilterModalShown] = useState(false)
    // Create / edit guest type
    const [guestTypeIndex, setGuestTypeIndex] = useState('')
    const [name, setName] = useState('')
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

    const getGuestTypes = useCallback(actionType => {
        let queries = {}
        // When the state is reset, set the offset to 0
        if(actionType === reset){
            queries = {...guestType.filters}
            queries.offset = 0
        }
        // When the state is loaded more, increase the offset by the limit
        else if(actionType === append){
            queries = {...guestType.lastFilters}
            queries.offset += queries.limit 
        }
        setDisableBtn(true)
        api.get(`/guest-types${getQueryString(queries)}`)
        .then(response => {
            const responseData = response.data
            setDisableBtn(false)
            setFilterModalShown(false)
            dispatch(actionType({
                guestTypes: responseData.guestTypes,
                filters: responseData.filters
            }))
        })
        .catch(error => {
            errorHandler(error)
        })
    }, [guestType, dispatch])

    const createGuestType = useCallback(() => {
        setGuestTypeIndex('')
        setName('')
        setMakeGuestTypeMdlHeading('Create Guest Type')
        setMakeGuestTypeMdlShown(true)        
    }, [])

    const storeGuestType = useCallback(() => {
        setDisableBtn(true)

        api.post(`/guest-types`, {
            name: name
        })
        .then(response => {
            setDisableBtn(false)
            setMakeGuestTypeMdlShown(false)                
            dispatch(prepend({
                guestTypes: response.data.guestType,
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

    const editGuestType = useCallback((index) => {
        const targetGuestType = guestType.guestTypes[index] // Get the guest type
        setGuestTypeIndex(index)
        setName(targetGuestType.name)
        setMakeGuestTypeMdlHeading('Edit Guest Type')
        setMakeGuestTypeMdlShown(true)
    }, [guestType.guestTypes])

    const updateGuestType = useCallback(() => {
        const targetGuestType = guestType.guestTypes[guestTypeIndex] // Get the guest type
        setDisableBtn(true)

        api.put(`/guest-types/${targetGuestType.id}`, {
            name: name
        })
        .then(response => {
            setDisableBtn(false)
            setMakeGuestTypeMdlShown(false)      
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)                         
            dispatch(replace({
                guestType: response.data.guestType,
                index: guestTypeIndex                
            }))
        })
        .catch(err => {
            errorHandler(err, {'400': () => {
                setDisableBtn(false)
                setErrPopupShown(true)
                setErrPopupMsg(err.response.data.message)                   
            }})
        })
    }, [dispatch, name, guestType.guestTypes, guestTypeIndex])

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
                dispatch(remove( {indexes: guestTypeIndex} ))               
            })
            .catch(err => {
                errorHandler(err, {'400': () => {
                    setDisableBtn(false)
                    setErrPopupShown(true)
                    setErrPopupMsg(err.response.data.message)                      
                }})               
            })          
    }, [dispatch, guestType.guestTypes, guestTypeIndex])


    useEffect(() => {       
        if(guestType.isLoaded === false){
            getGuestTypes(reset)
        }
    }, [guestType.isLoaded, getGuestTypes])

    useEffect(() => {
        return () => {
            // Make sure sync 'filters' and 'lastFilters' before leaving this page
            // so when user enter this page again, the 'filters' is the same as 'lastFilters'
            dispatch(syncFilters())
        }
    }, [dispatch])     

    useEffect(() => {
        setPageHeading({title: 'Guest Types', icon: 'briefcase'})
    }, [])
    
    if(guestType.isLoaded === false){
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
                            placeholder: 'Search guest types', value: guestType.filters.name,
                            onChange: (e) => {dispatch(updateFilters([
                                {key: 'name', value: e.target.value}
                            ]))},
                            onKeyUp: (e) => {keyHandler(e, 'Enter', () => {getGuestTypes(reset)})}                               
                        }}
                    />
                    <Button text={'Search'} iconName={'search'} iconOnly={'true'} attr={{
                        style: {flexShrink: 0},
                        disabled: disableBtn,
                        onClick: () => {getGuestTypes(reset)}
                    }}/>      
                </section>,
                <GuestTypesTable
                    guestTypes={guestType.guestTypes}
                    editHandler={editGuestType}
                    deleteHandler={confirmDeleteGuestType}
                />,
                guestType.canLoadMore ? 
                <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '0 auto'}} 
                onClick={() => {getGuestTypes(append)}} disabled={disableBtn}>
                    Load More
                </button> : ''                  
            ]}/>}
        />
        <Modal
            size={'sm'} 
            shown={filterModalShown}
            toggleModal={() => {setFilterModalShown(state => !state)}}
            heading={'Filter Guest Type'}
            body={<>
                <Grid numOfColumns={1} items={[
                    <Select label={'Rows shown'} formAttr={{value: guestType.filters.limit, onChange: (e) => {
                            dispatch(updateFilters( [{key: 'limit', value: e.target.value}] ))
                        }}}
                        options={[{value: 10}, {value: 20}, {value: 30}]}                        
                    />
                ]}/>
            </>}
            footer={<Button text={'Filter'} attr={{
                disabled: disableBtn, onClick: () => {getGuestTypes(reset)}
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
            ]}/>}
            footer={<Button text={'Save changes'} attr={{
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
        headings={['No.', 'Name', 'Actions']}
        body={guestTypes.map((guestType, index) => ([
            (index + 1),
            guestType.name, 
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