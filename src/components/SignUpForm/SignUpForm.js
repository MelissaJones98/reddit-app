import { useState } from 'react';
import './SignUpForm.css';

function SignUpForm({ onSignUpSuccess }) { // this function calls the onSignUpSuccess function from App
  const [username, setUsername] = useState(''); // current text in the username field
  const [email, setEmail] = useState(''); // current text in the email field
  const [password, setPassword] = useState(''); // current text in the password field
  const [confirmPassword, setConfirmPassword] = useState(''); // current text in the confirm password field
  const [error, setError] = useState(''); // any error message to display
  // all start as an empty string

  // runs when the submit btn is clicked - async because it has to wait for the server to reply
  const handleSubmit = async (e) => {
    e.preventDefault(); // stops the browser's default behaviour of reloading the page which would wipe the React state
    setError(''); // clears any old error messages before checking again

    // checked in the browser first - no point asking the server if the passwords don't even match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }), // confirmPassword is deliberately left out - the server only needs the real password
      });
      const data = await response.json(); // either { token, user } on success or { error } on failure

      if (response.ok) {
        onSignUpSuccess(data); // hands { token, user } up to App - sign up logs the user in automatically
      } else {
        setError(data.error || 'Sign up failed. Please try again.'); // e.g. 409 "Username or email already in use"
      }
    } catch (err) {
      // fetch only throws when there's no usable response at all e.g. the backend isn't running
      setError('Could not connect to the server. Please try again.');
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit}> {/* onSubmit={handleSubmit} connects it to the above function - this fires whenever the form is submitted */}
      <h2>Sign Up</h2>

      {/* username field */}
      <label htmlFor="signup-username">Username</label>
      <input
        id="signup-username"
        type="text"
        value={username} // makes this a controlled input - the input value is driven by React state, not the browser
        onChange={(e) => setUsername(e.target.value)} // fires on every keystroke, reading the newly typed value (e.target.value) and saving it into state via setUsername
      />
      {/* htmlFor="signup-username and id="signup-username are linked - makes the label clickable focussing the input and lets getByLabelText(/username/i) find this field in the tests */}

      {/* email field */}
      <label htmlFor="signup-email">Email</label>
      <input
        id="signup-email"
        type="email" // uses type email instead of text so the browser gets built in email format hints 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="signup-password">Password</label>
      <input
        id="signup-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label htmlFor="signup-confirm-password">Confirm Password</label>
      <input
        id="signup-confirm-password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn">Submit</button>
    </form>
  );
}

export default SignUpForm;