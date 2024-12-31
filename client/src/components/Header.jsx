import { Link } from "react-router-dom";
import { useSelector } from 'react-redux';
import logo from "./logo.png";
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-slate-200">
      <div className="flex justify-between items-center max-w-full mx-auto py-2 px-9">
        {/* Left Section: Logo */}
        <div className="flex items-center space-x-1">

        {currentUser ? (
        <Link to={currentUser.isAdmin ? '/admin-profile' : '/profile'}>
        <img src={logo} alt="EduCode Logo" className="h-16" />
          </Link>
        ) : (
          <Link to='/sign-in'>
          <img src={logo} alt="EduCode Logo" className="h-16" />
          </Link>
        )}

        </div>
        {/* Right Section: Navigation Links */}
        <ul className='flex gap-3 items-center'>
          <li>
            <Link to='/adminbook'>Book</Link>
          </li>
          <li>
            <Link to='/checkavailability'>Availability</Link>
          </li>
          <li>
            <Link to='/contact'>Contact Us</Link>
          </li>
          

          {/* Conditional rendering for profile picture */}
          {currentUser ? (
            <li>
              <Link to={currentUser.isAdmin ? '/admin-profile' : '/profile'}>
                <img
                  src={currentUser.profilePicture}
                  alt='profile'
                  className='h-8 w-8 rounded-full object-cover'
                />
              </Link>
            </li>
          ) : (
            <li>
              <Link to='/sign-in'>Sign In</Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
