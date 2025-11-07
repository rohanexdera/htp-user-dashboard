import React, { useState } from 'react';
import './Header.css';
import partyOneLogo from '../assets/partyonelogo.svg';

const Header = () => {
  const [language, setLanguage] = useState('English');

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
          <button className="menu-button">
            <span className="menu-line"></span>
            <span className="menu-line"></span>
            <span className="menu-line"></span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header;