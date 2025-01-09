import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Sidebar() {
  const { currentUser } = useSelector((state) => state.user);

  // Don't show the sidebar if no user is logged in
  if (!currentUser) return null;

  return (
    <div className="mt-20 sidebar w-64 h-full bg-gray-800 text-white fixed top-0 left-0">
      <h2 className="text-2xl font-bold p-4">
        {currentUser.isAdmin ? 'Admin Menu' : 'User Menu'}
      </h2>
      <ul className="p-4">
        
        {/* Links only visible to admins */}
        {currentUser.isAdmin && (
          <>
            <li className="mb-4">
              <Link to="/manage-users" className="hover:text-gray-300">
                Manage Users
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/messages" className="hover:text-gray-300">
                Contact Messages
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/addhotel" className="hover:text-gray-300">
              Add Hotels
              </Link>
            </li> 
            <li className="mb-4">
              <Link to="/hotels" className="hover:text-gray-300">
              Manage Hotels
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/adminbook" className="hover:text-gray-300">
              Add Bookings
              </Link>
            </li> 
            <li className="mb-4">
              <Link to="/managebookingadmin" className="hover:text-gray-300">
              Manage Bookings
              </Link>
            </li> 
            <li className="mb-4">
              <Link to="/checkavailability" className="hover:text-gray-300">
                Check Hotel Availability
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/sign-up" className="hover:text-gray-300">
                Add Admin
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/admin-contact-list" className="hover:text-gray-300">
                Contact Messages 
              </Link>
            </li>  
          </>
        )}

        {/* Links only visible to regular users */}
        {!currentUser.isAdmin && (
          <>
            <li className="mb-4">
              <Link to="/adminbook" className="hover:text-gray-300">
                Add Bookings
              </Link>
            </li>  
            <li className="mb-4">
              <Link to="/hotelmanage" className="hover:text-gray-300">
                Manage Bookings
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/checkavailability" className="hover:text-gray-300">
                Check Hotel Availability
              </Link>
            </li>  
            <li className="mb-4">
              <Link to="/contact-list" className="hover:text-gray-300">
                Contact List
              </Link>
            </li>    
          </>
        )}
      </ul>
    </div>
  );
};