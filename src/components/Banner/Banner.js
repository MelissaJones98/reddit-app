import './Banner.css'; // imports banner stylesheet
import logo from './logo.png';

// "isLoggedIn" and "onLogoutClick" are props - the login status changes the btn text but the state itself lives higher up in App not in Banner, Banner just displays what it is told
// "onSignUpClick" and "onLoginClick" are props NOT internal navigation

// banner is fully "dumb" it renders based on props and calls - its parent handles any actual navigation

// "searchTerm" and "onSearchChange" follow the same pattern - the search text lives in App, Banner just displays it and reports each keystroke

function Banner({ onSignUpClick, onLoginClick, isLoggedIn, onLogoutClick, searchTerm = '', onSearchChange }) {
  return (
    <header className="banner">
      <div className="banner-logo">
        <img src={logo} alt="Logo"></img>
      </div>

      <div className="banner-search">
        <input
          type="text"
          aria-label="search"
          placeholder="Search..."
          value={searchTerm} // controlled input - shows whatever App's searchTerm state currently is
          onChange={(e) => onSearchChange(e.target.value)} // reports the new text up to App on every keystroke
        />
      </div>

      <div className="banner-auth">
        <button className="btn" aria-label="sign up" onClick={onSignUpClick}> {/* aria-label provides an accessible name which is read by screen readers */}
          Sign Up
        </button>
        {isLoggedIn ? (
          <button className="btn" aria-label="log out" onClick={onLogoutClick}>
            Log Out
          </button>
        ) : (
          <button className="btn" aria-label="log in" onClick={onLoginClick}>
            Log In
          </button>
        )}
      </div>
    </header>
  );
}

export default Banner;