import './App.css';

import { useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Banner from './components/Banner/Banner';
import LoginForm from './components/LoginForm/LoginForm';
import SignUpForm from './components/SignUpForm/SignUpForm';
import PostFeed from './components/PostFeed/PostFeed';

function App() {
  const navigate = useNavigate(); // navigate is now a function that can be called anywhere in this component
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
