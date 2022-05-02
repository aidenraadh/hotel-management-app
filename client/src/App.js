import React, { useState } from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import {isAuth, getUser} from './components/Auth'
import Navigations from './components/Navigations'
import {UserThumbnail} from './components/Misc'

import LoginPage from './components/pages/LoginPage'
import HomePage from './components/pages/HomePage'

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
    const user = getUser()

    const sidebarItems = {
        dashboard: {
            icon: 'layers', text: 'Dashboard', link: ''
        },     
        room_type: {
            icon: 'hanger', text: 'Room Types', link: 'room-types'
        },
        guest_type: {
            icon: 'ecm004', text: 'Guest Types', link: 'guest-types'
        },
        room_service: {
            icon: 'gen017', text: 'Room Services', link: 'room-services'
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
                            />
                        ]}
                        sidebarItems={(() => {
                            const sidebarItemNames = [
                                'dashboard', 'room_type', 'guest_type', 'room_service'
                            ]
                            return sidebarItemNames.map(name => sidebarItems[name])
                        })()}	
                    /> : ''       
                )}
                <div id='app' className={userAuth ? 'authenticated': ''}>
                    <Switch>
                        <Route path="/login" exact component={LoginPage}/>
                        <ProtectedRoute path={'/'} exact component={HomePage}/>
                    </Switch>                    
                </div>     
            </Router>
        </ErrorBoundary>
    )
}

export default App