import './App.css';

import { useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Banner from './components/Banner/Banner';
import LoginForm from './components/LoginForm/LoginForm';
import SignUpForm from './components/SignUpForm/SignUpForm';
import PostFeed from './components/PostFeed/PostFeed';

// checks whether a token saved from an earlier visit can still be used
// NOTE: this only reads the token, it can't verify the signature (that needs JWT_SECRET, which only the server has) - so it decides what the UI shows, the server still decides what the user is allowed to do
function isTokenValid(token) {
  if (!token) return false; // nothing saved - never logged in, or logged out

  try {
    // a JWT is header.payload.signature - the payload is base64url encoded JSON e.g. { id, username, iat, exp }
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); // base64url uses - and _ where atob expects + and / (if there's no payload section, .replace throws and the catch handles it)
    const payload = JSON.parse(atob(base64)); // atob turns base64 back into the JSON text, JSON.parse turns that into an object

    return payload.exp * 1000 >= Date.now();
  } catch (err) {
    return false; // anything that isn't a well-formed JWT (missing sections, bad base64, bad JSON) counts as logged out
  }
}

function App() {
  const navigate = useNavigate(); // navigate is now a function that can be called anywhere in this component
  const [isLoggedIn, setIsLoggedIn] = useState(() => isTokenValid(localStorage.getItem('token'))); // a refresh wipes React state, so the starting value is rebuilt from the saved token
  // passing a function (rather than the value) means it only runs on the first render, not every re-render
  const [searchTerm, setSearchTerm] = useState(''); // lives in App because Banner (where it's typed) and PostFeed (where it's used) are siblings - their closest shared parent holds it

  //handler functions
  // data is the { token, user } object the backend sends back after a successful login or sign up
  const handleLoginSuccess = (data) => {
    localStorage.setItem('token', data.token); // saves the JWT so later requests (creating posts, reacting, commenting) can prove who the user is
    setIsLoggedIn(true);
    navigate('/'); // back to main page after login
  };

  const handleSignUpSuccess = (data) => {
    localStorage.setItem('token', data.token);
    setIsLoggedIn(true); // sign up logs the user in automatically
    navigate('/');
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('token'); // the token is the user's proof of login, so logging out throws it away
    setIsLoggedIn(false); // flips the isLoggedIn back to false - no navigation needed as logging out doesn't move the user to a different page
  };

  // mock data -----------------------------------------------------------------------------------------------------------------------------------
  const mockPosts = [
    {
      id: '1',
      postedBy: 'testuser',
      postHeading: 'My First Post',
      content: 'This is my first post content.',
      category: 'Games',
      likes: 0,
      dislikes: 0,
    },
    {
      id: '2',
      postedBy: 'anotheruser',
      postHeading: 'A Popular Post',
      content: 'This post already has some reactions.',
      category: 'News & Politics',
      likes: 5,
      dislikes: 2,
    },
  ];
  // ---------------------------------------------------------------------------------------------------------------------------------------------

  return (
    <>
      <Banner // banner is rendered with four props (three click handlers)
        isLoggedIn={isLoggedIn} // so it knows whether to show "Log In" or "Log Out"
        onLoginClick={() => navigate('/login')}  
        onSignUpClick={() => navigate('/signup')}
        onLogoutClick={handleLogoutClick} // passed directly because it doesn't require any arguments
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm} // the state setter can be passed directly - Banner calls it with the new text
      />
      {/* onLoginClick and onSignUpClick are written as small inline arrow functions rather than being passed directly because navigate needs to be called with an argument 
      when the button is clicked, not run immediately during render */}

      <Routes> {/* looks at the current URL and renders whichever route matches */}
        <Route path="/" element={<PostFeed posts={mockPosts} searchTerm={searchTerm} />} />
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
