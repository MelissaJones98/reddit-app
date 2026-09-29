import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // companion library that simulates how a real user interacts with a page: typing, clicking, tabbing, selecting etc
import { MemoryRouter } from 'react-router-dom'; 
// MemoryRouter provides React Router with the means to track the current "location" in a test environment in the same way that the window.history API does in a real browser.
import App from './App';

// searchBar Tests --------------------------------------------------------------------------------------------------------------------
// testing if the searchBar filters the page content based on user input into the input field
test('filters items based on search input', async () => {
  const user = userEvent.setup(); // creates a "user" object to interact w/ the page
  render(<App />); // renders the app in a fake browser environment - not the real browser

  // all items visible initially
  expect(screen.getByText('Apple')).toBeInTheDocument();
  expect(screen.getByText('Banana')).toBeInTheDocument();

  // type into the search bar
  await user.type(screen.getByRole('textbox', { name: /search/i }), 'app');

  // matching item stays, non-matching disappears
  expect(screen.getByText('Apple')).toBeInTheDocument();
  expect(screen.queryByText('Banana')).not.toBeInTheDocument();
});

test('shows everything again when the search is cleared', async () => {
  const user = userEvent.setup(); // creates a "user" object to interact w/ the page
  render(<App />);

  const input = screen.getByRole('textbox', { name: /search/i }); // finds the search input on the rendered page and stores it to be reused
  // getByRole('textbox') looks for text input
  // { name: /search/i } narrows it down to one whose accessible name contains "search" (case-sensitive, because of the i) 
  await user.type(input, 'app'); // simulates someone clicking into the input and typing "app" 
  await user.clear(input); // simulates the user selecting everything in the input and deleting it, leaving the box empty

  expect(screen.getByText('Banana')).toBeInTheDocument(); // looks for "Banana" on the page and asserts that it's there 
  // if the filter didn't clear properly Banana would still be hidden, getByText would throw an error and the test will fail
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

  // fill in and submit the form
  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // wait for the app to reflect the logged-in state
  expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument();
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

  // fill in and submit the form
  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/email/i), 'testuser@example.com');
  await user.type(screen.getByLabelText(/^password/i), 'password123');
  await user.type(screen.getByLabelText(/confirm password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // wait for the app to reflect the logged-in state
  expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument();
});

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

  // user should not be logged in
  expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();

  // form should still be open so the user can retry
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
});
// -----------------------------------------------------------------------------------------------------------------------------------