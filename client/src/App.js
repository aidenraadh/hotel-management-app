import React, { useState } from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import {isAuth, getUser} from './components/Auth'
import Navigations from './components/Navigations'
import {UserThumbnail} from './components/Misc'

import LoginPage from './components/pages/LoginPage'
import HomePage from './components/pages/HomePage'
import RoomTypePage from './components/pages/RoomTypePage'
import GuestTypePage from './components/pages/GuestTypePage'
import RoomPage from './components/pages/RoomPage'
import RoomServicePage from './components/pages/RoomServicePage'

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
    const user = getUser()

    const sidebarItems = {
        dashboard: {
            icon: 'layers', text: 'Dashboard', link: ''
        },     
        room_type: {
            icon: 'couch', text: 'Room Types', link: 'room-types'
        },
        guest_type: {
            icon: 'briefcase', text: 'Guest Types', link: 'guest-types'
        },
        room: {
            icon: 'door_open', text: 'Rooms', link: 'rooms'
        },        
        room_service: {
            icon: 'commode_1', text: 'Room Services', link: 'room-services'
        },        
    }
    const userAuth = isAuth()
        
    return (
        <ErrorBoundary>
            <Router>
                {(
                    userAuth ?
                    <Navigations
                        sidebarShown={sidebarShown}
                        toggleSidebar={setSidebarShown}
                        rightWidgets={[
                            <UserThumbnail 
                                userName={<Link to='/profile'>{user.name}</Link>}
                                imgUrl={'/images/user_default_thumbnail.jpg'}
                            />
                        ]}
                        sidebarItems={(() => {
                            const sidebarItemNames = [
                                'dashboard', 'room_type', 'guest_type', 'room', 'room_service'
                            ]
                            return sidebarItemNames.map(name => sidebarItems[name])
                        })()}	
                    /> : ''       
                )}
                <div id='app' className={userAuth ? 'authenticated': ''}>
                    <Switch>
                        <Route path="/login" exact component={LoginPage}/>
                        <ProtectedRoute path={'/'} exact component={HomePage}/>
                        <ProtectedRoute path={'/room-types'} exact component={RoomTypePage} props={{
                            user: user
                        }}/>         
                        <ProtectedRoute path={'/guest-types'} exact component={GuestTypePage} props={{
                            user: user
                        }}/>                                          
                        <ProtectedRoute path={'/rooms'} exact component={RoomPage} props={{
                            user: user
                        }}/>
                        <ProtectedRoute path={'/room-services'} exact component={RoomServicePage} props={{
                            user: user
                        }}/>                        
                    </Switch>                    
                </div>     
            </Router>
        </ErrorBoundary>
    )
}

export default App