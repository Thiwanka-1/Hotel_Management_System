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
          <img src={logo} alt="EduCode Logo" className="h-16" />
          <Link to='/'>
            <h1 className='font-bold text-2xl'>EduCode</h1>
          </Link>
        </div>

        {/* Right Section: Navigation Links */}
        <ul className='flex gap-3 items-center'>
          <li>
            <Link to='/'>Home</Link>
          </li>
          <li>
            <Link to='/about'>About Us</Link>
          </li>
          <li>
            <Link to='/contact'>Contact Us</Link>
          </li>
          <li>
            <Link to="/play-quiz">Play Quiz</Link>
          </li>
          <li>
            <Link to="/questions">Questions</Link>
          </li>
          <li className="relative">
            {/* Dropdown for Courses */}
            <button onClick={toggleDropdown} className="focus:outline-none">
              Courses
            </button>
            {dropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-50"
              >
                <Link
                  to="/courses/c"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  C
                </Link>
                <Link
                  to="/courses/cpp"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  C++
                </Link>
                <Link
                  to="/courses/java"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Java
                </Link>
                <Link
                  to="/courses/python"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Python
                </Link>
              </div>
            )}
          </li>

          {/* Conditionally render IDE link based on authentication */}
          <li>
            <Link to='/ide'>IDE</Link>
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
