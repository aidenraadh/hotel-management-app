import {logout} from '../Auth'
import {Button} from '../Buttons'

function HomePage(){
    return <>
        <Button text={'logout'} color={'red'} attr={{
            onClick: logout,
        }} />
    </>
}

export default HomePage