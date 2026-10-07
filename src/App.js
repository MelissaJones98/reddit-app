import './App.css';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'; // Navigate (capital N) is a component that redirects as soon as it's rendered
import Banner from './components/Banner/Banner';
import LoginForm from './components/LoginForm/LoginForm';
import SignUpForm from './components/SignUpForm/SignUpForm';
import PostFeed from './components/PostFeed/PostFeed';
import CreatePostForm from './components/CreatePostForm/CreatePostForm';
import PostPage from './components/PostPage/PostPage';

// reads the payload ({ id, username, iat, exp }) out of a token, or returns null if it isn't a well-formed JWT
// used by isTokenValid (on page load) and by the expiry timer in App (while the app is open)
// NOTE: this only reads the token, it can't verify the signature (that needs JWT_SECRET, which only the server has) - so it decides what the UI shows, the server still decides what the user is allowed to do
function readTokenPayload(token) {
  if (!token) return null; // nothing saved - never logged in, or logged out

  try {
    // a JWT is header.payload.signature - the payload is base64url encoded JSON e.g. { id, username, iat, exp }
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); // base64url uses - and _ where atob expects + and / (if there's no payload section, .replace throws and the catch handles it)
    return JSON.parse(atob(base64)); // atob turns base64 back into the JSON text, JSON.parse turns that into an object
  } catch (err) {
    return null; // anything that isn't a well-formed JWT (missing sections, bad base64, bad JSON)
  }
}

// checks whether a token saved from an earlier visit can still be used
function isTokenValid(token) {
  const payload = readTokenPayload(token);
  if (!payload) return false; // missing or not a real JWT counts as logged out

  return payload.exp * 1000 >= Date.now();
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
    setSessionNotice(''); // a fresh login replaces any old "session expired" message
    navigate('/'); // back to main page after login
  };

  const handleSignUpSuccess = (data) => {
    localStorage.setItem('token', data.token);
    setIsLoggedIn(true); // sign up logs the user in automatically
    setSessionNotice('');
    navigate('/');
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('token'); // the token is the user's proof of login, so logging out throws it away
    setIsLoggedIn(false); // flips the isLoggedIn back to false - no navigation needed as logging out doesn't move the user to a different page
  };

  // logging out automatically when the token expires ----------------------------------------------------------------------------------------------
  const [sessionNotice, setSessionNotice] = useState(''); // the "your session has expired" message, '' when there's nothing to show

  // like handleLogoutClick, but also tells the user why - they stay on whatever page they were on
  // useCallback keeps it the same function between renders, so the useEffect below doesn't restart its timer on every render
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setSessionNotice('Your session has expired. Please log in again.');
  }, []);

  // while logged in, wait until the moment the token expires, then log out
  // re-runs whenever isLoggedIn changes - logging in starts a timer for the new token, logging out runs the cleanup that cancels it
  useEffect(() => {
    if (!isLoggedIn) return; // logged out - nothing to time

    const payload = readTokenPayload(localStorage.getItem('token'));
    if (!payload) return; // not a real JWT (e.g. in some tests) - nothing to time

    const msUntilExpiry = payload.exp * 1000 - Date.now(); // exp is in seconds, Date.now() in milliseconds

    const timerId = setTimeout(handleSessionExpired, msUntilExpiry);
    return () => clearTimeout(timerId); // cancels the timer if login status changes to logged out
  }, [isLoggedIn, handleSessionExpired]);

  // posts from the backend -----------------------------------------------------------------------------------------------------------------------
  const [posts, setPosts] = useState([]); // the feed - starts empty until the server replies
  const [isLoadingPosts, setIsLoadingPosts] = useState(true); // true from the start, because the request begins as soon as App appears
  const [postsError, setPostsError] = useState(''); // a message to show if the posts couldn't be loaded

  // asks the server for the feed - used when App first appears AND by the "Try again" button
  // useCallback keeps this the same function between renders, so the useEffect below (which lists it as a dependency) only runs once rather than on every render
  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    setPostsError(''); // clear an old error when trying again

    try {
      // reading the feed is public, but sending the token (when there is one) lets the server include which posts THIS user has liked/disliked
      const token = localStorage.getItem('token');
      const response = await fetch('/api/posts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, // GET is fetch's default method, so only the headers need setting
      });
      const data = await response.json(); // an array of posts on success, or { error } on failure

      if (response.ok) {
        setPosts(data);
      } else {
        setPostsError('Could not load posts');
      }
    } catch (err) {
      // no usable response at all e.g. the backend isn't running
      setPostsError('Could not load posts. Please check your connection and try again.');
    } finally {
      setIsLoadingPosts(false); // finally runs whether the try worked or the catch ran - either way, we're no longer loading
    }
  }, []);

  // useEffect runs code AFTER the component appears on screen - here, it requests the feed once when App first loads
  // (fetching directly in the component body would run on every render, and each response would update state, causing another render... forever)
  // isLoggedIn is listed too, so the feed reloads after logging in or out - the server's userReaction on each post depends on who's asking
  useEffect(() => {
    loadPosts();
  }, [loadPosts, isLoggedIn]);

  // newPost is the post the server sent back from POST /api/posts - same shape as the posts in the feed
  const handlePostCreated = (newPost) => {
    const updatedPostFeed = [newPost];
    posts.forEach( (item) => {
      updatedPostFeed.push(item);
    });
    setPosts(updatedPostFeed);
    navigate('/'); // back to the feed to see it
  };

  // what to show on the home page: a loading message, an error with a way out, or the feed itself
  let homePage;
  if (isLoadingPosts) {
    homePage = <p className="feed-status">Loading posts...</p>;
  } else if (postsError) {
    homePage = (
      <div className="feed-status">
        <p>{postsError}</p>
        <button className="btn" onClick={loadPosts}>Try again</button> {/* lets the user leave the error state without refreshing the page */}
      </div>
    );
  } else {
    homePage = <PostFeed posts={posts} searchTerm={searchTerm} onLoginRequired={() => navigate('/login')} />; // logged out users who try to react are sent to log in
  }
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
        onCreatePostClick={() => navigate('/create')}
      />
      {/* onLoginClick and onSignUpClick are written as small inline arrow functions rather than being passed directly because navigate needs to be called with an argument
      when the button is clicked, not run immediately during render */}

      {sessionNotice && ( // only shown after an automatic logout
        <div className="session-notice" role="status"> {/* role="status" makes screen readers announce the message when it appears */}
          <span>{sessionNotice}</span>
          <button className="session-notice-dismiss" aria-label="dismiss" onClick={() => setSessionNotice('')}>✕</button>
        </div>
      )}

      <Routes> {/* looks at the current URL and renders whichever route matches */}
        <Route path="/" element={homePage} />
        <Route
          path="/login"
          element={<LoginForm onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/signup"
          element={<SignUpForm onSignUpSuccess={handleSignUpSuccess} />}
        />
        <Route
          path="/post/:id" // :id is a URL parameter - /post/12 matches, and PostPage reads '12' with useParams
          element={<PostPage onLoginRequired={() => navigate('/login')} />}
        />
        <Route
          path="/create"
          element={
            isLoggedIn
              ? <CreatePostForm onPostCreated={handlePostCreated} />
              : <Navigate to="/login" replace /> // logged out users are sent to log in - replace swaps /create out of the browser history so Back doesn't bounce them here again
          }
        />
      </Routes>
    </>
  );
}

export default App;
