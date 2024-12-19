import { BrowserRouter, Routes, Route} from 'react-router-dom';

import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';

import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

import AdminProfile from './pages/AdminProfile';
import ManageUsers from './pages/ManageUsers';
import ContactUs from './pages/ContactUs';
import ViewMessages from './pages/ViewMessages';



export default function App() {
  return <BrowserRouter>
  <Header />
    <Routes>
      <Route path = "/" element = {<Home />} />
      <Route path = "/contact" element = {<ContactUs />} />
      <Route path = "/sign-in" element = {<SignIn />} />
      <Route path = "/sign-up" element = {<SignUp />} />

      <Route element={<PrivateRoute />}>
        <Route path = "/profile" element = {<Profile />} />
      </Route>

      <Route element={<PrivateRoute adminOnly={true} />}>
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path='/admin-profile' element={<AdminProfile />} />
        <Route path='/messages' element={<ViewMessages />} />        

      </Route>
    </Routes>
  
  </BrowserRouter>
    
}
