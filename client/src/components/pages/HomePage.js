import { useEffect } from 'react'
import {logout} from '../Auth'
import {Button} from '../Buttons'

function HomePage({setPageHeading}){
    useEffect(() => {
        setPageHeading({title: 'Dashboard', icon: 'layers'})
    }, [])
    return <>
        <Button text={'logout'} color={'red'} attr={{
            onClick: logout,
        }} />
    </>
}

export default HomePage