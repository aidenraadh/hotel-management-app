import {useState, useCallback, useEffect}  from "react"
import {api, errorHandler} from '../Utils'
import {saveUser, logout} from '../Auth'
import {Button} from '../Buttons'
import {SimpleCard} from '../Cards'
import {Modal, ConfirmPopup} from '../Windows'
import {TextInput, TextInputWithBtn} from '../Forms'
import {Grid} from '../Layouts'

function ProfilePage({user, setPageHeading}){
    const [disableBtn , setDisableBtn] = useState(false)

    const [name, setNameName] = useState(user.name)
    const [oldPassword, setOldPassword] = useState('')
    const [oldPasswordShown, setOldPasswordShown] = useState(true)
    const [newPassword, setNewPassword] = useState('')  
    const [newPasswordShown, setNewPasswordShown] = useState(true)
    const [updProfileModal, setUpdProfileModal] = useState(false)  
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')    
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)  
    const [succPopupMsg, setSuccPopupMsg] = useState('')   

    const updateProfile = useCallback(() => {
        setDisableBtn(true)
        api.put(`/users/update-profile`, {
            name: name,
            oldPassword: oldPassword,
            newPassword: newPassword,
        })
        .then(response => {
            saveUser(response.data.user)
            setDisableBtn(false)
            setUpdProfileModal(false)
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)
        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(error.response.data.message)                      
            }})           
        })   
    }, [name, oldPassword, newPassword, setUpdProfileModal, setDisableBtn])

    useEffect(() => {
        setPageHeading({title: 'Profile', icon: 'user'})
    }, [])    

    if(!user){
        return 'Loading ...'
    }
    return (<>
        <SimpleCard
            attr={{id: 'profile-card'}}
            heading={'Your Profile'}
            body={
                <p className="flex-row items-start">
                    <img src='images/user_default_thumbnail.jpg' alt='user avatar'/>
                    <span className="flex-col">
                        <span>Name: {user.name}</span>
                        <span>Role: {user.role.name}</span>                        
                    </span>
                    <Button text={'Update profile'} size={'sm'} attr={{
                        onClick: () => {setUpdProfileModal(true)}
                    }}/>                     
                </p>  
            }
            action={<>            
                <Button text={'Logout'} color={'red'} size={'sm'} attr={{
                    onClick: () => {
                        localStorage.removeItem("languages");
                        logout()
                    },
                }} />            
            </>}
        />
        <Modal
            heading={'Update Profile'}
            body={<Grid numOfColumns={1} items={[
                <TextInput label={'Name'} formAttr={{
                    value: name, onChange: (e) => {setNameName(e.target.value)}
                }}/>,
                <TextInputWithBtn label={'Old password'} btnIconName={oldPasswordShown ? 'visible' : 'hidden'}
                    formAttr={{
                        type: (oldPasswordShown ? 'text' : 'password'),
                        value: oldPassword, onChange: (e) => {setOldPassword(e.target.value)}
                    }}
                    btnAttr={{onClick: () => {setOldPasswordShown(state => !state)}}}
                />,
                <TextInputWithBtn label={'New password'} btnIconName={newPasswordShown ? 'visible' : 'hidden'}
                    formAttr={{
                        type: (newPasswordShown ? 'text' : 'password'),
                        value: newPassword, onChange: (e) => {setNewPassword(e.target.value)}
                    }}
                    btnAttr={{onClick: () => {setNewPasswordShown(state => !state)}}}
                />,          
            ]}/>}
            shown={updProfileModal}
            toggleModal={() => {setUpdProfileModal(state => !state)}}
            footer={<Button size={'md'} text={'Save changes'} attr={{
                disabled: disableBtn,
                onClick: () => {updateProfile()}
            }}/>}
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
            body={succPopupMsg}
            confirmText={'OK'}
            togglePopup={() => {setSuccPopupShown(state => !state)}} 
            confirmCallback={() => {
                // Refresh the page
                window.location.reload()
            }}
        />                   
    </>)
}

export default ProfilePage