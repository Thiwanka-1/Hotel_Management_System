import { BrowserRouter, Routes, Route} from 'react-router-dom';

import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';

import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

import AdminProfile from './pages/AdminProfile';
import ManageUsers from './pages/ManageUsers';
import ViewMessages from './pages/ViewMessages';

import AddHotel from './pages/hotels/AddHotel';
import HotelsTable from './pages/hotels/HotelsTable';
import HotelDetails from './pages/hotels/HotelDetails';
import UpdateHotel from './pages/hotels/UpdateHotel';
import AdminBooking from './pages/booking/AdminBooking';
import AdminBookingManagement from './pages/booking/AdminBookingManagement';
import BookingDetails from './pages/booking/BookingDetails';
import UpdateBooking from './pages/booking/UpdateBooking';
import HotelBookingManagement from './pages/booking/HotelBookingManagement';
import CheckRoomAvailability from './pages/hotels/CheckRoomAvailability';
import BookingDetailsHotel from './pages/booking/BookingDetailsHotel';

import ContactForm from './pages/contact/ContactForm ';
import ConversationsList from './pages/contact/ConversationsList';
import AdminConversationsList from './pages/contact/AdminConversationsList';
import ConversationDetail from './pages/contact/ConversationDetail';
import HotelConversationDetail from './pages/contact/HotelConversationDetail';



export default function App() {
  return <BrowserRouter>
  <Header />
    <Routes>
      <Route path = "/sign-in" element = {<SignIn />} />
      <Route path = "/sign-up" element = {<SignUp />} />
      
      <Route path = "/contact" element = {<ContactForm />} />
      <Route path = "/contact-list" element = {<ConversationsList />} />
      <Route path="/conversation/:conversationId" element={<ConversationDetail />} />
      <Route path = "/hotel/conversation/:conversationId" element = {<HotelConversationDetail />} />


      <Route element={<PrivateRoute />}>
        <Route path = "/profile" element = {<Profile />} />
        <Route path = "/hotelmanage" element = {<HotelBookingManagement />} />
        <Route path="/adminbook" element={<AdminBooking />} />
        <Route path="/checkavailability" element={<CheckRoomAvailability />} />
        <Route path="/update-booking/:id" element={<UpdateBooking />} />
        <Route path="/hotel-booking-details/:id" element={<BookingDetailsHotel />} />
        <Route path = "/admin-contact-list" element = {<AdminConversationsList />} />

      </Route>
      <Route element={<PrivateRoute adminOnly={true} />}>
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path='/admin-profile' element={<AdminProfile />} />
        <Route path='/messages' element={<ViewMessages />} />  
        <Route path = "/booking-details/:id" element = {<BookingDetails />} />

        <Route path='/addhotel' element={<AddHotel />} />     
        <Route path="/hotels" element={<HotelsTable />} />
        <Route path="/hotels/:id" element={<HotelDetails />} />
        <Route path="/hotels/update/:id" element={<UpdateHotel />} />
        <Route path="/managebookingadmin" element={<AdminBookingManagement />} />

      </Route>
    </Routes>
  
  </BrowserRouter>
    
}
