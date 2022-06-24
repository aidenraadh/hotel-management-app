import {useCallback, useState}  from "react"
import {api, keyHandler} from '../Utils'
import {Navigate} from "react-router"

import {Button} from '../Buttons'
import {TextInput, TextInputWithBtn} from '../Forms'
import {Grid} from '../Layouts'
import {isAuth, login} from '../Auth'

const LoginPage = (props) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordShown, setPasswordShown] = useState(false)
    const containerBg = {
        background: 'url("/images/bg-1.jpg") no-repeat scroll center',
        backgroundSize: 'cover',
    }
    const requestLogin = useCallback(() => {
        api
        .post('/login', {
            email: email, password: password
        })
        .then(response => login(response))
        .catch(error => {
            if(error.response.status === 400){
                alert(error.response.data.message)
            }            
            if(error.response.status === 401){
                login()
            }
        })        
    }, [email, password])
    // When the user already authenticated
    if(isAuth()){
        return <Navigate to={'/'}/>
    }

    return (<>
        <div id='login-page-container' className="flex-col content-center items-center" style={containerBg}>
            <h1 className="text-bold text-white text-center">Hotel Management App</h1>
            <Grid numOfColumns={'1'} items={[
                <TextInput size={'lg'}
                    formAttr={{
                        value: email, placeholder: 'Email', 
                        onChange: (e) => {setEmail(e.target.value)},
                        onKeyUp: (e) => {keyHandler(e, 'Enter', requestLogin)}
                    }} 
                />,
                <TextInputWithBtn size={'lg'} btnIconName={passwordShown ? 'visible' : 'hidden'}
                    btnAttr={{onClick: () => {setPasswordShown(state => !state)}}}
                    formAttr={{
                        type: passwordShown ? 'text' : 'password', 
                        value: password, placeholder: 'Password', 
                        onChange: (e) => {setPassword(e.target.value)},
                        onKeyUp: (e) => {keyHandler(e, 'Enter', requestLogin)}                        
                    }} 
                />,     
                <Button 
                    attr={{id: 'login-btn', onClick: () => {requestLogin(email, password)}}} 
                    text={'Login'} size={'lg'}
                />,
            ]}/>
        </div>
    </>)
}

export default LoginPage