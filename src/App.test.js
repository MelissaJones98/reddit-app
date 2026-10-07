import { render, screen, within } from '@testing-library/react'; // within limits a search to inside one element, e.g. the options of one dropdown
import userEvent from '@testing-library/user-event'; // companion library that simulates how a real user interacts with a page: typing, clicking, tabbing, selecting etc
import { MemoryRouter } from 'react-router-dom';
// MemoryRouter provides React Router with the means to track the current "location" in a test environment in the same way that the window.history API does in a real browser.
import Banner from './components/Banner/Banner';
import LoginForm from './components/LoginForm/LoginForm';
import SignUpForm from './components/SignUpForm/SignUpForm';
import Post from './components/Post/Post';
import PostFeed from './components/PostFeed/PostFeed';
import CategoryFilter from './components/CategoryFilter/CategoryFilter';
import App from './App';

// mock data for testing as there isn't a backend yet ---------------------------------------------------------------------------------
const mockPost = {
  id: '1',
  postedBy: 'testuser',
  postHeading: 'My First Post',
  content: 'This is the post content.',
  category: 'Games', // category added for testing the new category filter component
  likes: 0,
  dislikes: 0,
};

// second mock objects with likes and dislikes already on the post
const mockPostWithCounts = {
  id: '2',
  postedBy: 'testuser',
  postHeading: 'A Popular Post',
  content: 'This post already has some reactions.',
  category: 'News & Politics',
  likes: 5,
  dislikes: 2,
};

const mockPosts = [
  {
    id: '1',
    postedBy: 'testuser',
    postHeading: 'My First Post',
    content: 'This is the first post.',
    category: 'Science',
    likes: 0,
    dislikes: 0,
  },
  {
    id: '2',
    postedBy: 'anotheruser',
    postHeading: 'A Second Post',
    content: 'This is the second post.',
    category: 'Anime & Cosplay',
    likes: 3,
    dislikes: 1,
  },
];
// -----------------------------------------------------------------------------------------------------------------------------------

// fetch mocking ----------------------------------------------------------------------------------------------------------------------
// the login and sign up forms now talk to the backend using fetch - the tests replace fetch with a jest mock so they never hit the real server
const originalFetch = global.fetch;

beforeEach(() => {
  // a fresh mock before every test so calls from one test can't leak into the next
  // App fetches /api/posts as soon as it appears, so by default every fetch succeeds with an empty list - tests that care about the response queue their own with mockFetchResponse
  // (a queued ...Once response is always used before this default)
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => [] }));
  localStorage.clear(); // the token is stored in localStorage after login/sign up - start every test logged out
});

afterEach(() => {
  global.fetch = originalFetch; // put the real fetch back
});

// makes the next fetch call resolve with a fake response shaped like the real one: ok (true for 2xx statuses), status, and a json() method returning the body
const mockFetchResponse = (status, body) => {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
};

// what a successful /api/login or /api/signup response looks like (matches auth.js)
const mockAuthResponse = {
  token: 'fake-jwt-token',
  user: { id: 1, username: 'testuser', email: 'testuser@example.com' },
};
// -----------------------------------------------------------------------------------------------------------------------------------

// searchBar Tests --------------------------------------------------------------------------------------------------------------------
// the search input lives in Banner (dumb - it only reports what's typed via onSearchChange), App holds the searchTerm state,
// and PostFeed receives searchTerm as a prop and filters the posts by heading - same pattern as CategoryFilter/activeCategory

// test 1: Banner reports what the user types up to its parent
test('typing in the search bar calls onSearchChange with the typed text', async () => {
  const user = userEvent.setup(); // creates a "user" object to interact w/ the page
  const handleSearchChange = jest.fn(); // mock function standing in for App's state setter

  render(<Banner isLoggedIn={false} searchTerm="" onSearchChange={handleSearchChange} />);

  await user.type(screen.getByRole('textbox', { name: /search/i }), 'a'); // getByRole('textbox') looks for a text input, { name: /search/i } narrows it to the one labelled "search"

  expect(handleSearchChange).toHaveBeenCalledWith('a');
});

// test 2: only posts whose heading contains the search term are shown
test('filters posts by heading based on the search term', () => {
  render(<PostFeed posts={mockPosts} searchTerm="first" />);

  expect(screen.getByText('My First Post')).toBeInTheDocument(); // matching post stays
  expect(screen.queryByText('A Second Post')).not.toBeInTheDocument(); // non-matching post disappears - queryByText because we're checking absence
});

// test 3: users shouldn't have to match the capitalisation of a heading
test('search ignores upper and lower case', () => {
  render(<PostFeed posts={mockPosts} searchTerm="SECOND" />);

  expect(screen.getByText('A Second Post')).toBeInTheDocument();
  expect(screen.queryByText('My First Post')).not.toBeInTheDocument();
});

// test 3b: stray spaces around the search term are ignored
test('search ignores spaces before and after the search term', () => {
  render(<PostFeed posts={mockPosts} searchTerm="  first  " />);

  expect(screen.getByText('My First Post')).toBeInTheDocument();
  expect(screen.queryByText('A Second Post')).not.toBeInTheDocument();
});

// test 4: clearing the search brings every post back
test('shows everything again when the search is cleared', () => {
  const { rerender } = render(<PostFeed posts={mockPosts} searchTerm="first" />); // rerender lets the same component be given new props, like App would after the user deletes their search

  expect(screen.queryByText('A Second Post')).not.toBeInTheDocument();

  rerender(<PostFeed posts={mockPosts} searchTerm="" />);

  expect(screen.getByText('My First Post')).toBeInTheDocument();
  expect(screen.getByText('A Second Post')).toBeInTheDocument();
});

// test 5: a search with no matches shows the existing "no posts" message rather than a blank page
test('shows the no posts message when nothing matches the search', () => {
  render(<PostFeed posts={mockPosts} searchTerm="zzzz" />);

  expect(screen.getByText(/no posts to show yet/i)).toBeInTheDocument();
});

// test 6: search and category filter are applied together - a post has to match both to be shown
test('search and category filter work together', async () => {
  const user = userEvent.setup();
  render(<PostFeed posts={mockPosts} searchTerm="second" />); // "A Second Post" matches the search but is in Anime & Cosplay

  await user.click(screen.getByRole('button', { name: /^science$/i })); // "My First Post" is in Science but doesn't match the search

  expect(screen.getByText(/no posts to show yet/i)).toBeInTheDocument(); // neither post matches both filters
});

// test 7: FULL FLOW - type in the Banner's search bar and the feed on the home page filters
test('typing in the search bar filters the posts in the feed', async () => {
  const user = userEvent.setup();
  mockFetchResponse(200, mockPosts); // the posts App loads from GET /api/posts - queued BEFORE render because App fetches as soon as it appears

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByText('My First Post')).toBeInTheDocument(); // findBy waits for the fetch to finish
  expect(screen.getByText('A Second Post')).toBeInTheDocument();

  await user.type(screen.getByRole('textbox', { name: /search/i }), 'second');

  expect(screen.getByText('A Second Post')).toBeInTheDocument();
  expect(screen.queryByText('My First Post')).not.toBeInTheDocument();
});
// -----------------------------------------------------------------------------------------------------------------------------------

// loading posts from the backend -----------------------------------------------------------------------------------------------------
// App fetches the feed from GET /api/posts when it first appears, instead of using hardcoded posts

// test 1: the request goes to the right place
test('requests the posts from /api/posts when the app loads', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  await screen.findByText(/no posts to show yet/i); // wait for the (empty, default) response to be handled before the test ends
  expect(global.fetch).toHaveBeenCalledWith('/api/posts', { headers: {} }); // logged out - no Authorization header
});

// test 2: the posts the server sends back appear in the feed
test('shows the posts loaded from the server', async () => {
  mockFetchResponse(200, mockPosts);

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByText('My First Post')).toBeInTheDocument();
  expect(screen.getByText('A Second Post')).toBeInTheDocument();
});

// test 3: something is shown while waiting, so the page doesn't look empty or broken
test('shows a loading message while the posts are loading', () => {
  global.fetch.mockReturnValueOnce(new Promise(() => {})); // a promise that never settles - the request stays "in progress" forever

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/loading posts/i)).toBeInTheDocument();
  expect(screen.queryByText(/no posts to show yet/i)).not.toBeInTheDocument(); // "no posts" would be misleading - we don't know yet
});

// test 4: the server can't be reached (backend not running) - fetch throws
test('shows an error when the posts cannot be loaded', async () => {
  global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByText(/could not load posts/i)).toBeInTheDocument();
  expect(screen.queryByText(/no posts to show yet/i)).not.toBeInTheDocument(); // an error isn't the same as an empty feed
});

// test 5: the server replies but with an error status (e.g. a 500 from a database problem)
test('shows an error when the server responds with an error status', async () => {
  mockFetchResponse(500, { error: 'Something went wrong' });

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByText(/could not load posts/i)).toBeInTheDocument();
});

// test 6: the user can leave the error state - "Try again" re-requests the posts
test('clicking Try again after an error loads the posts', async () => {
  const user = userEvent.setup();
  global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch')); // first attempt fails
  mockFetchResponse(200, mockPosts); // second attempt succeeds

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  await user.click(await screen.findByRole('button', { name: /try again/i }));

  expect(await screen.findByText('My First Post')).toBeInTheDocument();
  expect(screen.queryByText(/could not load posts/i)).not.toBeInTheDocument();
});
// -----------------------------------------------------------------------------------------------------------------------------------

// create post form -------------------------------------------------------------------------------------------------------------------
// logged in users can write a post from the app - it's sent to POST /api/posts with their token so the server knows who wrote it
// these tests start logged in by saving a valid token before rendering (the same trick as the "survives a refresh" tests)
const loginBeforeRender = () => {
  const token = makeFakeToken({ id: 1, username: 'testuser', exp: Math.floor(Date.now() / 1000) + 60 * 60 });
  localStorage.setItem('token', token);
  return token; // returned so tests can check it's sent to the server
};

// fills in all three fields of the form
const fillInPost = async (user) => {
  await user.type(screen.getByLabelText(/heading/i), 'My brand new post');
  await user.type(screen.getByLabelText(/content/i), 'Something worth sharing');
  await user.selectOptions(screen.getByLabelText(/category/i), 'Technology'); // selectOptions picks an option in a <select>, like a user choosing from the dropdown
};

// what POST /api/posts sends back when a post is created (matches routes/posts.js)
const mockCreatedPost = {
  id: 99,
  postedBy: 'testuser',
  postHeading: 'My brand new post',
  content: 'Something worth sharing',
  category: 'Technology',
  likes: 0,
  dislikes: 0,
};

// test 1: only logged in users see the button - logged out users can't post, so offering it would only lead to an error
test('the Create Post button only shows when logged in', () => {
  const { unmount } = render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.queryByRole('button', { name: /create post/i })).not.toBeInTheDocument();
  unmount(); // removes the first App so the second render starts clean

  loginBeforeRender();
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument();
});

// test 2: the button opens the form
test('clicking Create Post opens the create post form', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  await user.click(screen.getByRole('button', { name: /create post/i }));

  expect(screen.getByRole('heading', { name: /create a post/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/heading/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
});

// test 3: the dropdown offers real topics only - 'All' and 'Most Visited' are feed views, and the server would reject them
test('the category dropdown lists post categories but not All or Most Visited', () => {
  loginBeforeRender();
  render(
    <MemoryRouter initialEntries={['/create']}>
      <App />
    </MemoryRouter>
  );

  const dropdown = screen.getByLabelText(/category/i);
  expect(within(dropdown).getByRole('option', { name: 'Technology' })).toBeInTheDocument();
  expect(within(dropdown).getByRole('option', { name: 'Nature & Outdoors' })).toBeInTheDocument();
  expect(within(dropdown).queryByRole('option', { name: 'All' })).not.toBeInTheDocument();
  expect(within(dropdown).queryByRole('option', { name: 'Most Visited' })).not.toBeInTheDocument();
});

// test 4: the request matches what routes/posts.js and requireAuth expect
test('submitting sends the post and the token to /api/posts', async () => {
  const user = userEvent.setup();
  const token = loginBeforeRender();
  render(
    <MemoryRouter initialEntries={['/create']}>
      <App />
    </MemoryRouter>
  );

  mockFetchResponse(201, mockCreatedPost);
  await fillInPost(user);
  await user.click(screen.getByRole('button', { name: /^post$/i }));

  expect(global.fetch).toHaveBeenCalledWith('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // the format requireAuth reads: "Bearer " then the token
    },
    body: JSON.stringify({ postHeading: 'My brand new post', content: 'Something worth sharing', category: 'Technology' }),
  });
});

// test 5: after posting, the user lands back on the feed and their post is at the top - without reloading the whole feed
test('after creating a post the feed shows it at the top', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  mockFetchResponse(200, mockPosts); // the feed App loads first

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  await screen.findByText('My First Post'); // wait for the feed to load
  await user.click(screen.getByRole('button', { name: /create post/i }));

  mockFetchResponse(201, mockCreatedPost);
  await fillInPost(user);
  await user.click(screen.getByRole('button', { name: /^post$/i }));

  const headings = await screen.findAllByText(/My brand new post|My First Post|A Second Post/); // all three post headings, in the order they appear on the page
  expect(headings.map((heading) => heading.textContent)).toEqual(['My brand new post', 'My First Post', 'A Second Post']);
});

// test 6: empty fields are caught in the browser - no point sending a request the server will reject
test('shows an error and sends nothing when fields are empty', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  render(
    <MemoryRouter initialEntries={['/create']}>
      <App />
    </MemoryRouter>
  );

  await user.type(screen.getByLabelText(/heading/i), 'Only a heading');
  await user.click(screen.getByRole('button', { name: /^post$/i }));

  expect(screen.getByText(/please fill in/i)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalledWith('/api/posts', expect.objectContaining({ method: 'POST' }));
});

// test 7: the server rejects the post (e.g. 401 because the token expired) - its message is shown and the form stays open
test('shows the server\'s error when the post is rejected', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  render(
    <MemoryRouter initialEntries={['/create']}>
      <App />
    </MemoryRouter>
  );

  mockFetchResponse(401, { error: 'Your session has expired, please log in again' });
  await fillInPost(user);
  await user.click(screen.getByRole('button', { name: /^post$/i }));

  expect(await screen.findByText(/your session has expired/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/heading/i)).toHaveValue('My brand new post'); // what they typed isn't lost
});

// test 8: the server can't be reached
test('shows an error when the server cannot be reached while posting', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  render(
    <MemoryRouter initialEntries={['/create']}>
      <App />
    </MemoryRouter>
  );

  global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await fillInPost(user);
  await user.click(screen.getByRole('button', { name: /^post$/i }));

  expect(await screen.findByText(/could not connect to the server/i)).toBeInTheDocument();
});

// test 9: logged out users who go straight to /create (e.g. a bookmark) are sent to the login form instead
test('visiting /create while logged out shows the login form', () => {
  render(
    <MemoryRouter initialEntries={['/create']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /create a post/i })).not.toBeInTheDocument();
});
// -----------------------------------------------------------------------------------------------------------------------------------

// log in status full flow tests -----------------------------------------------------------------------------------------------------
// FULL FLOW: Click login → fill out the form → submit → confirm you land back on a page where the button now says "Log out"

// test 1: tests the sign up button - clicking it navigates to the sign up form
test('clicking sign up button navigates to the sign up form', async () => {
  const user = userEvent.setup(); // creates a "user" object to interact w/ the page
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  // renders "App" into the test environment but wrapped in MemoryRouter

  await user.click(screen.getByRole('button', { name: /sign up/i }));

  expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
});

// test 2: tests the login button - clicking it navigates to the login form
test('clicking login button navigates to the login form', async () => {
  const user = userEvent.setup(); // creates a "user" object to interact w/ the page
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  // renders "App" into the test environment but wrapped in MemoryRouter

  // navigate to the login form
  await user.click(screen.getByRole('button', { name: /log in/i })); 

  // confirm the login form is now showing
  expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
});

// test 3: tests the login button again - after successfully logging in through the form, the button's text updates to "Log Out"
test('login button shows "Log out" after a successful login', async () => {
  const user = userEvent.setup(); // creates a "user" object to interact w/ the page
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  // renders "App" into the test environment but wrapped in MemoryRouter

  // navigate to the login form
  await user.click(screen.getByRole('button', { name: /log in/i }));

  // the server will accept this login
  mockFetchResponse(200, mockAuthResponse);

  // fill in and submit the form
  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // wait for the app to reflect the logged-in state
  expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument();

  // the token from the server is saved so later requests can prove who the user is
  expect(localStorage.getItem('token')).toBe('fake-jwt-token');
});

// test 3b: the login form sends the typed details to the backend in the format auth.js expects
test('login form sends the username and password to /api/login', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );

  mockFetchResponse(200, mockAuthResponse);

  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(global.fetch).toHaveBeenCalledWith('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // without this express.json() ignores the body
    body: JSON.stringify({ username: 'testuser', password: 'password123' }),
  });
});

// test 4: after a successful sign up the user is automatically logged in and the button flips to "Log Out"
test('login button shows "Log out" after a successful sign up', async () => {
  const user = userEvent.setup(); // creates a "user" object to interact w/ the page
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  // renders "App" into the test environment but wrapped in MemoryRouter

  await user.click(screen.getByRole('button', { name: /sign up/i }));

  // confirm we're on the sign up form
  expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();

  // the server will accept this sign up (201 = created)
  mockFetchResponse(201, mockAuthResponse);

  // fill in and submit the form
  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/email/i), 'testuser@example.com');
  await user.type(screen.getByLabelText(/^password/i), 'password123');
  await user.type(screen.getByLabelText(/confirm password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // wait for the app to reflect the logged-in state
  expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBe('fake-jwt-token');
});

// test 4b: the sign up form sends username, email and password - confirmPassword is only checked in the browser and never sent
test('sign up form sends the username, email and password to /api/signup', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <App />
    </MemoryRouter>
  );

  mockFetchResponse(201, mockAuthResponse);

  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/email/i), 'testuser@example.com');
  await user.type(screen.getByLabelText(/^password/i), 'password123');
  await user.type(screen.getByLabelText(/confirm password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(global.fetch).toHaveBeenCalledWith('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', email: 'testuser@example.com', password: 'password123' }),
  });
});

// test 5: logging out removes the stored token
test('logging out removes the stored token', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );

  mockFetchResponse(200, mockAuthResponse);

  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await user.click(await screen.findByRole('button', { name: /log out/i }));

  expect(localStorage.getItem('token')).toBeNull();
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
});

// staying logged in after a page refresh ---------------------------------------------------------------------------------------------
// a refresh wipes React state, so App has to rebuild isLoggedIn from the token saved in localStorage
// a JWT is three base64 sections joined by dots: header.payload.signature - the payload holds "exp", the expiry time in SECONDS since 1970
// this helper builds a fake token with whatever payload a test needs (the signature is never checked in the browser, only by the server)
const makeFakeToken = (payload) => `fake-header.${btoa(JSON.stringify(payload))}.fake-signature`;
const nowInSeconds = () => Math.floor(Date.now() / 1000);

// test 6: a saved token that hasn't expired keeps the user logged in
test('stays logged in after a refresh when a valid token is saved', () => {
  localStorage.setItem('token', makeFakeToken({ id: 1, username: 'testuser', exp: nowInSeconds() + 60 * 60 })); // expires in an hour

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  ); // rendering App fresh is the test equivalent of refreshing the page

  expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
});

// test 7: an expired token (older than the 7 day expiry) is treated as logged out
test('shows logged out after a refresh when the saved token has expired', () => {
  localStorage.setItem('token', makeFakeToken({ id: 1, username: 'testuser', exp: nowInSeconds() - 60 })); // expired a minute ago

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
});

// test 8: a token that isn't a real JWT (e.g. tampered with or corrupted) doesn't crash the app - it's treated as logged out
test('shows logged out after a refresh when the saved token is not a valid JWT', () => {
  localStorage.setItem('token', 'not-a-real-token');

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
});
// -----------------------------------------------------------------------------------------------------------------------------------

//Failure Case Tests
// failure case 1: bad login
test('shows an error when login fails with incorrect credentials', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  // confirm we're on the log in form
  await user.click(screen.getByRole('button', { name: /log in/i }));

  // the server rejects the login with the same 401 response auth.js sends
  mockFetchResponse(401, { error: 'Incorrect username or password' });

  // fill in and submit the form with incorrect details
  await user.type(screen.getByLabelText(/username/i), 'wronguser');
  await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // error message appears
  expect(await screen.findByText(/incorrect username or password/i)).toBeInTheDocument();

  // button should NOT have changed to "Log out"
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();

  // form should still be open so the user can retry
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

// failure case 2: bad sign up validation
test('shows a validation error when sign up passwords do not match', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  await user.click(screen.getByRole('button', { name: /sign up/i }));

  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/email/i), 'testuser@example.com');
  await user.type(screen.getByLabelText(/^password/i), 'password123');
  await user.type(screen.getByLabelText(/confirm password/i), 'password456');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // validation error appears
  expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();

  // the mismatch is caught in the browser so no sign up request is sent to the server (App's own /api/posts request is fine)
  expect(global.fetch).not.toHaveBeenCalledWith('/api/signup', expect.anything());

  // user should not be logged in
  expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();

  // form should still be open so the user can retry
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
});

// failure case 3: the server rejects the sign up (e.g. 409 when the username or email is taken) - the server's message is shown
test('shows the server\'s error when sign up is rejected', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <App />
    </MemoryRouter>
  );

  mockFetchResponse(409, { error: 'Username or email already in use' });

  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/email/i), 'testuser@example.com');
  await user.type(screen.getByLabelText(/^password/i), 'password123');
  await user.type(screen.getByLabelText(/confirm password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByText(/username or email already in use/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
});

// failure case 4: the server can't be reached (backend not running, no internet) - fetch itself throws rather than returning a response
test('shows an error when the server cannot be reached during login', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );

  global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch')); // what a real browser throws when the request can't connect

  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByText(/could not connect to the server/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
});
// -----------------------------------------------------------------------------------------------------------------------------------

// post/post feed/detailed post tests ------------------------------------------------------------------------------------------------
// test 1: basic rendering 
// renders post with the mock data passed in as a prop, then checks username, heading and content text all appear on the page
test('renders the post details', () => {
  render(<Post post={mockPost} />);

  expect(screen.getByText('testuser')).toBeInTheDocument();
  expect(screen.getByText('My First Post')).toBeInTheDocument();
  expect(screen.getByText('This is the post content.')).toBeInTheDocument();
});

// test 2: the four action buttons exist
// checks all four buttons are present, each found by its accessible name
test('renders Like, Dislike, Comments and Share buttons', () => {
  render(<Post post={mockPost} />);

  expect(screen.getByRole('button', { name: /^like/i })).toBeInTheDocument(); // anchored with ^ - otherwise /like/i also matches "dislike" and finds two buttons
  expect(screen.getByRole('button', { name: /dislike/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /comments/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
});

// reactions now go through the server: Post sends the click to POST /api/posts/:id/reactions and shows the totals the server sends back
// the toggle rules themselves (add / remove / switch) are tested in backend/tests/reactions.test.js, because that's where they live now

// test 3: clicking Like shows the server's new count
// confirms the count starts at 0 - using { selector: '.like-count' } as a second argument to getByText narrows the search to only elements with that class
test('clicking Like shows the like count returned by the server', async () => {
  const user = userEvent.setup();
  loginBeforeRender(); // reacting needs a token
  render(<Post post={mockPost} />);

  expect(screen.getByText('0', { selector: '.like-count' })).toBeInTheDocument();

  mockFetchResponse(200, { likes: 1, dislikes: 0, userReaction: 'like' });
  await user.click(screen.getByRole('button', { name: /^like/i })); // checked with this unique identifer so two items aren't accidentally matched

  expect(await screen.findByText('1', { selector: '.like-count' })).toBeInTheDocument(); // findBy - the count changes once the server replies
});

// test 4: clicking Dislike shows the server's new count
// targets .dislike-count (doesnt need anchoring since dislike is the longer more specific string)
test('clicking Dislike shows the dislike count returned by the server', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  render(<Post post={mockPost} />);

  expect(screen.getByText('0', { selector: '.dislike-count' })).toBeInTheDocument();

  mockFetchResponse(200, { likes: 0, dislikes: 1, userReaction: 'dislike' });
  await user.click(screen.getByRole('button', { name: /dislike/i }));

  expect(await screen.findByText('1', { selector: '.dislike-count' })).toBeInTheDocument();
});

// test 5: commments opens a modal
// first confirms no dialogue exists before anything is clicked (queryByRole since we are checking absence) 
// after clicking comments it checks a dialog now exists with an accessible name matching the post's heading - this ties the opened modal to a specifc post
test('clicking Comments opens the detailed post view', async () => {
  const user = userEvent.setup();
  render(<Post post={mockPost} />);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /comments/i }));

  expect(screen.getByRole('dialog', { name: /my first post/i })).toBeInTheDocument();
});

// test 6: share copies a link
// copying to clipboard using a real browser API (navigator.clipboard.writeText) which doesn't exist in the test environment
test('clicking Share copies the post link to the clipboard', async () => {
  const user = userEvent.setup(); // user-event attaches its own fake clipboard to navigator here (jsdom doesn't have one)

  // navigator.clipboard is read-only so it can't be replaced with Object.assign - instead spy on user-event's fake clipboard to record what's written to it
  const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');

  render(<Post post={mockPost} />);

  await user.click(screen.getByRole('button', { name: /share/i }));

  expect(writeTextSpy).toHaveBeenCalledWith(
    expect.stringContaining('/post/1')
  );
});

// test 7: considers there may already be likes/dislikes on a post before the user clicks the buttons
// would catch bugs like " the count always resets to 1 instead of incrementing from whatever it started at"
test('like and dislike counts start at the post\'s existing values and update from the server\'s replies', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  render(<Post post={mockPostWithCounts} />);

  // starts at the post's existing counts, not zero
  expect(screen.getByText('5', { selector: '.like-count' })).toBeInTheDocument(); // checks the initial render - does the componenet correctly display the current counts?
  expect(screen.getByText('2', { selector: '.dislike-count' })).toBeInTheDocument();

  // click like button - the server adds the like to the existing 5
  mockFetchResponse(200, { likes: 6, dislikes: 2, userReaction: 'like' });
  await user.click(screen.getByRole('button', { name: /^like/i }));

  // checks that the likes went up by 1 and the dislikes stayed the same because only the like button was clicked
  expect(await screen.findByText('6', { selector: '.like-count' })).toBeInTheDocument();
  expect(screen.getByText('2', { selector: '.dislike-count' })).toBeInTheDocument();

  // click the dislike button - the server switches the like to a dislike (the one reaction per user rule)
  mockFetchResponse(200, { likes: 5, dislikes: 3, userReaction: 'dislike' });
  await user.click(screen.getByRole('button', { name: /dislike/i }));

  // checks the display follows the server's switch: likes back down by 1, dislikes up by 1
  expect(await screen.findByText('5', { selector: '.like-count' })).toBeInTheDocument();
  expect(screen.getByText('3', { selector: '.dislike-count' })).toBeInTheDocument();
});

// test 8: the request matches what routes/posts.js and requireAuth expect
test('clicking Like sends the reaction and the token to the server', async () => {
  const user = userEvent.setup();
  const token = loginBeforeRender();
  render(<Post post={mockPost} />);

  mockFetchResponse(200, { likes: 1, dislikes: 0, userReaction: 'like' });
  await user.click(screen.getByRole('button', { name: /^like/i }));

  expect(global.fetch).toHaveBeenCalledWith('/api/posts/1/reactions', { // mockPost has id '1'
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type: 'like' }),
  });
});

// test 9: the button the user has pressed is marked, using aria-pressed like the category buttons
test('marks the user\'s reaction as pressed using the server\'s reply', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  render(<Post post={mockPost} />);

  expect(screen.getByRole('button', { name: /^like/i })).toHaveAttribute('aria-pressed', 'false');

  mockFetchResponse(200, { likes: 1, dislikes: 0, userReaction: 'like' });
  await user.click(screen.getByRole('button', { name: /^like/i }));

  expect(await screen.findByRole('button', { name: /^like/i, pressed: true })).toBeInTheDocument(); // pressed: true finds the button only once aria-pressed is "true"
  expect(screen.getByRole('button', { name: /dislike/i })).toHaveAttribute('aria-pressed', 'false');
});

// test 10: after a refresh the feed says which button the user pressed before (userReaction from GET /api/posts)
test('shows the user\'s existing reaction from the feed as pressed', () => {
  render(<Post post={{ ...mockPostWithCounts, userReaction: 'dislike' }} />); // a copy of the post with userReaction added

  expect(screen.getByRole('button', { name: /dislike/i })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /^like/i })).toHaveAttribute('aria-pressed', 'false');
});

// test 11: logged out users are asked to log in instead - nothing is sent and the counts don't change
test('clicking Like while logged out asks the user to log in', async () => {
  const user = userEvent.setup();
  const handleLoginRequired = jest.fn(); // stands in for App's "go to the login form"
  render(<Post post={mockPost} onLoginRequired={handleLoginRequired} />); // no loginBeforeRender - logged out

  await user.click(screen.getByRole('button', { name: /^like/i }));

  expect(handleLoginRequired).toHaveBeenCalled();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.getByText('0', { selector: '.like-count' })).toBeInTheDocument();
});

// test 11a: the other side of test 11 - a logged in user's click goes to the server, NOT to the login form
test('clicking Like while logged in does not ask the user to log in', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  const handleLoginRequired = jest.fn();
  render(<Post post={mockPost} onLoginRequired={handleLoginRequired} />); // the prop IS passed, like it is in the real feed

  mockFetchResponse(200, { likes: 1, dislikes: 0, userReaction: 'like' });
  await user.click(screen.getByRole('button', { name: /^like/i }));

  expect(await screen.findByText('1', { selector: '.like-count' })).toBeInTheDocument();
  expect(handleLoginRequired).not.toHaveBeenCalled();
});

// test 11b: the server rejects the reaction (e.g. expired session) - its message shows and the counts stay as they were
test('shows the server\'s error and keeps the counts when a reaction is rejected', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  render(<Post post={mockPostWithCounts} />);

  mockFetchResponse(401, { error: 'Your session has expired, please log in again' });
  await user.click(screen.getByRole('button', { name: /^like/i }));

  expect(await screen.findByText(/your session has expired/i)).toBeInTheDocument();
  expect(screen.getByText('5', { selector: '.like-count' })).toBeInTheDocument(); // unchanged
});

// test 11c: the server can't be reached
test('shows an error when the server cannot be reached while reacting', async () => {
  const user = userEvent.setup();
  loginBeforeRender();
  render(<Post post={mockPost} />);

  global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await user.click(screen.getByRole('button', { name: /^like/i }));

  expect(await screen.findByText(/could not connect to the server/i)).toBeInTheDocument();
});

// test 11d: FULL FLOW - in the real app, a logged out click on Like in the feed opens the login form
test('clicking Like in the feed while logged out opens the login form', async () => {
  const user = userEvent.setup();
  mockFetchResponse(200, mockPosts);
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  await screen.findByText('My First Post');
  await user.click(screen.getAllByRole('button', { name: /^like/i })[0]); // getAll - every post has a Like button, [0] is the first post's

  expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
});

// test 11e: the feed request includes the token when logged in, so the server can fill in userReaction
test('the feed request sends the token when logged in', async () => {
  const token = loginBeforeRender();
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  await screen.findByText(/no posts to show yet/i);
  expect(global.fetch).toHaveBeenCalledWith('/api/posts', { headers: { Authorization: `Bearer ${token}` } });
});

// test 12: basic multiplicity
test('renders a Post for each item in the posts array', () => {
  render(<PostFeed posts={mockPosts} />); // renders PostFeed with the two item array

  expect(screen.getByText('My First Post')).toBeInTheDocument(); // checks BOTH headings appear on the page
  expect(screen.getByText('A Second Post')).toBeInTheDocument();
});

// test 13: correct pairing of data
// catches bugs like every post in the loop is accidentally displaying the last post's data instead of its own
test('renders each post\'s own content, not mixed up with another post\'s', () => {
  render(<PostFeed posts={mockPosts} />);

  expect(screen.getByText('testuser')).toBeInTheDocument(); // checks testuser pairs with the first post's content
  expect(screen.getByText('This is the first post.')).toBeInTheDocument();

  expect(screen.getByText('anotheruser')).toBeInTheDocument(); // and another user pairs with the second post's data
  expect(screen.getByText('This is the second post.')).toBeInTheDocument();
  // this confirms that each post instance is really getting its onw data
});

// test 14: the empty state
test('shows a message when there are no posts', () => {
  render(<PostFeed posts={[]} />); // renders with an empty array instead of post data - simulating what happens before any posts exist or if a future API call returns nothing

  expect(screen.getByText(/no posts/i)).toBeInTheDocument(); // checks for some text matching "no posts" (case-insensitive) 
  // forces the component to handle the empty case deliberately - preventing what from a user's perspective looks like a broken page to an intentional "nothing here yet" message
});
// -----------------------------------------------------------------------------------------------------------------------------------

// categoryFilter component tests ----------------------------------------------------------------------------------------------------
// test 1: renders a button for each category plus "All"
test('renders a button for each category plus "All"', () => {
  render(
    <CategoryFilter
      categories={['All', 'Games', 'News & Politics']} // "categories" is the actual category names - NOT placeholders. 'All' is included because PostFeed passes it in as part of the list (CategoryFilter doesn't add it itself)
      activeCategory="All"
      onSelectCategory={() => {}}
    />
  );

  // checks for the expected categories from the mock data being passed in
  expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument(); // ^all$ means that it needs to find a string that matches the accessible name exactly (case-insensitive)
  expect(screen.getByRole('button', { name: /^games$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /news & politics/i })).toBeInTheDocument();
});

// test 2: calls onSelectCategory with the clicked category
test('calls onSelectCategory with the clicked category', async () => {
  const user = userEvent.setup();
  const handleSelect = jest.fn(); // real mock function (jest.fn();) 

  render(
    <CategoryFilter
      categories={['Games', 'News & Politics']}
      activeCategory="All"
      onSelectCategory={handleSelect}
    />
  );

  await user.click(screen.getByRole('button', { name: /^games$/i })); // simulates a click on the "Games" button 

  expect(handleSelect).toHaveBeenCalledWith('Games'); // checks the mock function was called with the exact string 'Games'
  // this proves that clicking a specific button reports that button's category name back to the parent (not hardcoded or the wrong value)
});

// test 3: marks the active category button as pressed
test('marks the active category button as pressed', () => {
  render( // renders posts w/ the same category as the one selected
    <CategoryFilter
      categories={['All','Games', 'News & Politics']}
      activeCategory="Games"
      onSelectCategory={() => {}}
    />
  );

  expect(screen.getByRole('button', { name: /^games$/i })).toHaveAttribute('aria-pressed', 'true'); // the "Games" button should be true as it matches the active category
  expect(screen.getByRole('button', { name: /news & politics/i })).toHaveAttribute('aria-pressed', 'false'); // the "News & Politics" button should be false since it's not active
});
// -----------------------------------------------------------------------------------------------------------------------------------