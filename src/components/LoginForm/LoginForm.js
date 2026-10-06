import { useState } from 'react'; // lets the component hold and update its own local data i.e values typed into each field plus any error messages
import './LoginForm.css';

function LoginForm({ onLoginSuccess }) { // this function calls the onLoginSuccess function from App
  const [username, setUsername] = useState(''); // current text in the username field
  const [password, setPassword] = useState(''); // current text in the password field
  const [error, setError] = useState(''); // any error message to display
  // all start as an empty string

  // runs when the submit btn is clicked - async because it has to wait for the server to reply
  const handleSubmit = async (e) => {
    e.preventDefault(); // stops the browser's default behaviour of reloading the page which would wipe the React state
    setError(''); // clears any old error messages before checking again

    try {
      // sends the typed details to the backend - '/api/login' is relative, the "proxy" in package.json forwards it to localhost:5000 during development
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // tells express.json() the body is JSON
        body: JSON.stringify({ username, password }), // turns the JS object into the JSON string the server expects
      });
      const data = await response.json(); // either { token, user } on success or { error } on failure

      if (response.ok) {
        onLoginSuccess(data); // if the response is a 2XX (i.e successful) then the data is passed to onLoginSuccess
      } else {
        setError(data.error || 'Login failed. Please try again.'); // if unsuccessful an error is displayed based on the response from the server (with a fallback in case it's missing)
      }
    } catch (err) {
      // fetch only throws when there's no usable response at all e.g. the backend isn't running
      setError('Could not connect to the server. Please try again.');
    }
  };

  // form element
  return (
    <form className="login-form" onSubmit={handleSubmit}> {/* onSubmit={handleSubmit} connects it to the above function - this fires whenever the form is submitted */}
      <h2>Log In</h2>

      {/* username field */}
      <label htmlFor="login-username">Username</label> 
      <input
        id="login-username"
        type="text"
        value={username} // makes this a controlled input - the input value is driven by React state, not the browser
        onChange={(e) => setUsername(e.target.value)} // fires on every keystroke, reading the newly typed value (e.target.value) and saving it into state via setUsername
      /> 
      {/* htmlFor="login-username and id="login-username are linked - makes the label clickable focussing the input and lets getByLabelText(/username/i) find this field in the tests */}

      {/* password field */}
      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* conditional error display */}
      {error && <p className="form-error">{error}</p>} 
      {/* if error is a non-empty string (truthy) the <p> renders, if error is '' (falsy) nothing renders - therefore will only appear after a failed login attempt */}

      <button type="submit" className="btn">Submit</button> 
    </form>
  );
}

export default LoginForm;