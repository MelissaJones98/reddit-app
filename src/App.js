import './App.css';

import { useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Banner from './components/Banner/Banner';
import LoginForm from './components/LoginForm/LoginForm';
import SignUpForm from './components/SignUpForm/SignUpForm';
// !!import other page components as you build them

function App() {
  const navigate = useNavigate(); // navigate is now a function that can be called anywhere in this component
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  //handler functions
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate('/'); // back to main page after login
  };

  const handleSignUpSuccess = () => {
    setIsLoggedIn(true); // sign up logs the user in automatically
    navigate('/');
  };

  const handleLogoutClick = () => {
    setIsLoggedIn(false); // flips the isLoggedIn back to false - no navigation needed as logging out doesn't move the user to a different page
  };

  return (
    <>
      <Banner // banner is rendered with four props (three click handlers)
        isLoggedIn={isLoggedIn} // so it knows whether to show "Log In" or "Log Out"
        onLoginClick={() => navigate('/login')}  
        onSignUpClick={() => navigate('/signup')}
        onLogoutClick={handleLogoutClick} // passed directly because it doesn't require any arguments
      />
      {/* onLoginClick and onSignUpClick are written as small inline arrow functions rather than being passed directly because navigate needs to be called with an argument 
      when the button is clicked, not run immediately during render */}

      <Routes> // looks at the current URL and renders whichever route matches 
        <Route path="/" element={/* your main page content */ null} /> // !!null is a placeholder 
        <Route
          path="/login"
          element={<LoginForm onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/signup"
          element={<SignUpForm onSignUpSuccess={handleSignUpSuccess} />}
        />
      </Routes>
    </>
  );
}

export default App;
