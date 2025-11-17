import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import partyOneLogo from '../assets/partyonelogo.svg';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

const Header = () => {
  const [language, setLanguage] = useState('English');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser, clearUserData } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleProfileClick = () => {
    setMenuOpen(false);
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUserData();
      setMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <div className="logo-icon">
            <img src={partyOneLogo} alt="Party One Logo" className="logo-img" />
          </div>
        </div>

        {/* Right side controls */}
        <div className="header-controls">
          {/* Language Selector */}
          <div className="language-selector">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="language-dropdown"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>

          {/* Menu Button */}
          <div className="menu-wrapper">
            <button 
              ref={buttonRef}
              className="menu-button" 
              onClick={handleMenuToggle}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span className="menu-line"></span>
              <span className="menu-line"></span>
              <span className="menu-line"></span>
            </button>

            {/* Menu Popup - only show if user is signed in */}
            {menuOpen && currentUser && (
              <div ref={menuRef} className="menu-popup">
                <button 
                  className="menu-item" 
                  onClick={handleProfileClick}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor"/>
                    <path d="M10 12C4.477 12 0 14.686 0 18V20H20V18C20 14.686 15.523 12 10 12Z" fill="currentColor"/>
                  </svg>
                  <span>Profile</span>
                </button>
                <button 
                  className="menu-item logout" 
                  onClick={handleLogout}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 4L11.59 5.41L14.17 8H4V10H14.17L11.59 12.59L13 14L18 9L13 4Z" fill="currentColor"/>
                    <path d="M18 16H10V18H18C19.1 18 20 17.1 20 16V4C20 2.9 19.1 2 18 2H10V4H18V16Z" fill="currentColor"/>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header;