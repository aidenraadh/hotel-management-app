import React, {useState } from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom'

import Protected from './components/Protected'
import {isAuth, getUser} from './components/Auth'
import Navigations from './components/Navigations'
import {UserThumbnail} from './components/Misc'

import LoginPage from './components/pages/LoginPage'
import HomePage from './components/pages/HomePage'
import RoomTypePage from './components/pages/RoomTypePage'
import GuestTypePage from './components/pages/GuestTypePage'
import RoomPage from './components/pages/RoomPage'
import RoomServicePage from './components/pages/RoomServicePage'
import IndexRoomPricingPage from './components/pages/room_pricing/IndexRoomPricingPage'
import CrtEdtRoomPricingPage from './components/pages/room_pricing/CrtEdtRoomPricingPage'
import ProfilePage from './components/pages/ProfilePage'

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
    const user = getUser()
    const userAuth = isAuth()

    const sidebarItems = {
        dashboard: {
            icon: 'layers', text: 'Dashboard', link: '/'
        },     
        room_type: {
            icon: 'couch', text: 'Room Types', link: '/room-types'
        },
        guest_type: {
            icon: 'briefcase', text: 'Guest Types', link: '/guest-types'
        },
        room: {
            icon: 'door_open', text: 'Rooms', link: '/rooms'
        },        
        room_service: {
            icon: 'commode_1', text: 'Room Services', link: '/room-services'
        },          
        pricing_manager: {
            icon: 'sale_2', text: 'Pricing Manager', subItems: [
                {text: 'Room Pricings', link: '/room-pricings'}
            ]
        }             
    }        
    return (
        <ErrorBoundary>
            <Router>
                {(
                    userAuth ?
                    <Navigations
                        sidebarShown={sidebarShown}
                        toggleSidebar={setSidebarShown}
                        rightWidgets={[
                            <Link to='/profile'>
                                <UserThumbnail 
                                    userName={user.name}
                                    imgUrl={'/images/user_default_thumbnail.jpg'}
                                />                            
                            </Link>
                        ]}
                        sidebarItems={(() => {
                            const sidebarItemNames = [
                                'dashboard', 'room_type', 'guest_type', 'room', 'room_service',
                                'pricing_manager'
                            ]
                            return sidebarItemNames.map(name => sidebarItems[name])
                        })()}	
                    /> : ''       
                )}
                <div id='app' className={userAuth ? '': 'not-auth'}>
                    <Routes>
                        <Route path="/login" exact element={<LoginPage/>}/>
                        <Route path={`/${sidebarItems.dashboard.link}`} exact element={
                            <Protected isAuth={userAuth}>
                                <HomePage/>
                            </Protected>                            
                        }/>
                        <Route path={'/profile'} exact element={
                            <Protected isAuth={userAuth}>
                                <ProfilePage user={user}/>
                            </Protected>                            
                        }/>       
                        <Route path={'/room-types'} exact element={
                            <Protected isAuth={userAuth}>
                                <RoomTypePage user={user}/>
                            </Protected>                            
                        }/>              
                        <Route path={'/guest-types'} exact element={
                            <Protected isAuth={userAuth}>
                                <GuestTypePage user={user}/>
                            </Protected>                            
                        }/>   
                        <Route path={'/rooms'} exact element={
                            <Protected isAuth={userAuth}>
                                <RoomPage user={user}/>
                            </Protected>                            
                        }/>
                        <Route path={'/room-services'} exact element={
                            <Protected isAuth={userAuth}>
                                <RoomServicePage user={user}/>
                            </Protected>                            
                        }/>      
                        <Route path={'/room-pricings'} exact element={
                            <Protected isAuth={userAuth}>
                                <IndexRoomPricingPage user={user}/>
                            </Protected>                            
                        }/>         
                        <Route path={'/room-pricings/create'} exact element={
                            <Protected isAuth={userAuth}>
                                <CrtEdtRoomPricingPage user={user}/>
                            </Protected>                            
                        }/>                          
                        <Route path={'/room-pricings/edit/:id'} exact element={
                            <Protected isAuth={userAuth}>
                                <CrtEdtRoomPricingPage user={user}/>
                            </Protected>                            
                        }/>                                                                                                                             
                    </Routes>                    
                </div>     
            </Router>
        </ErrorBoundary>
    )
}

export default App