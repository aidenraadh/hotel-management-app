import React, { useReducer, useState } from "react";
import ErrorBoundary from './components/ErrorBoundary'
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom'

import roomTypeReducer, {INIT_STATE as ROOM_TYPE_INIT_STATE} from "./reducers/RoomTypeReducer";
import guestTypeReducer, {INIT_STATE as GUEST_TYPE_INIT_STATE} from "./reducers/GuestTypeReducer";
import roomReducer, {INIT_STATE as ROOM_INIT_STATE} from "./reducers/RoomReducer";
import roomPricingReducer, {INIT_STATE as ROOM_PRICING_INIT_STATE} from "./reducers/RoomPricingReducer";

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
import IndexRoomPricingPage from './components/pages/room_pricing/IndexRoomPricingPage'
import CrtEdtRoomPricingPage from './components/pages/room_pricing/CrtEdtRoomPricingPage'
import ProfilePage from './components/pages/ProfilePage'

function App(){
    const [sidebarShown, setSidebarShown] = useState(false)
    const [roomType, dispatchRoomType] = useReducer(roomTypeReducer, ROOM_TYPE_INIT_STATE)   
    const [guestType, dispatchGuestType] = useReducer(guestTypeReducer, GUEST_TYPE_INIT_STATE) 
    const [room, dispatchRoom] = useReducer(roomReducer, ROOM_INIT_STATE)    
    const [roomPricing, dispatchRoomPricing] = useReducer(roomPricingReducer, ROOM_PRICING_INIT_STATE)  
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
        room_pricing: {
            icon: 'sale_1', text: 'Room Pricings', link: 'room-pricings'
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
                                'room_pricing'
                            ]
                            return sidebarItemNames.map(name => sidebarItems[name])
                        })()}	
                    /> : ''       
                )}
                <div id='app' className={userAuth ? 'authenticated': ''}>
                    <Switch>
                        <Route path="/login" exact component={LoginPage}/>
                        <ProtectedRoute path={'/'} exact component={HomePage}/>
                        <ProtectedRoute path={'/profile'} exact component={ProfilePage} props={{
                            user: user
                        }}/>                         
                        <ProtectedRoute path={'/room-types'} exact component={RoomTypePage} props={{
                            user: user, roomType: roomType, dispatchRoomType: dispatchRoomType
                        }}/>         
                        <ProtectedRoute path={'/guest-types'} exact component={GuestTypePage} props={{
                            user: user, guestType: guestType, dispatchGuestType: dispatchGuestType
                        }}/>                                          
                        <ProtectedRoute path={'/rooms'} exact component={RoomPage} props={{
                            user: user, room: room, dispatchRoom: dispatchRoom
                        }}/>
                        <ProtectedRoute path={'/room-services'} exact component={RoomServicePage} props={{
                            user: user
                        }}/>        
                        <ProtectedRoute path={'/room-pricings'} exact component={IndexRoomPricingPage} props={{
                            user: user, roomPricing: roomPricing, dispatchRoomPricing: dispatchRoomPricing
                        }}/>          
                        <ProtectedRoute path={'/room-pricings/edit'} exact component={CrtEdtRoomPricingPage} props={{
                            user: user,
                        }}/>                                                         
                    </Switch>                    
                </div>     
            </Router>
        </ErrorBoundary>
    )
}

export default App