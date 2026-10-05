# Codecademy Off-Platform Project: Reddit App

## Description
A Reddit clone application using React and Redux. The application will allow users to view and search posts and comments provided by the API.
Please note that credit for any branding and the logo goes to Reddit. 

** **PLEASE NOTE**
There is a big constraint with using the Reddit API for this project. Reddit's Data API now requires developers to 
formally request non-commerical access (which requires a support ticket, not instant signup) before the developer is approved
to use it. 

As this project is designed entirely to be a learning/portfolio project I have decided to go an alternative route to complete this project
and make it fully functional. After carrying out some research I decided to create my own databases and build a real full-stack app. This means
my forms will need to do genuine authentication. 

## Features
- Users can use the application on any device (desktop to mobile)
- Users can use the application on any modern browser
- Users can access your application at a URL
- Users see an initial view of the data when first visiting the app
- Users can search the data using terms
- Users can filter the data based on categories that are predefined
- Users are shown a detailed view (modal or new page/route) when they select an item
- Users are delighted with a cohesive design system
- Users are delighted with animations and transitions
- Users are able to leave an error state

## Wireframe
![Reddit App Wireframe](./redditApp.drawio.png)

## How to Use
1. Create a PostgreSQL database called `reddit_app` (e.g. in pgAdmin: right-click Databases → Create → Database...)
2. Create the tables: open the Query Tool on the `reddit_app` database as `postgres` and run the contents of `backend/db/schema.sql`
3. Create a service account user for the app and give it access to the tables. Run the following SQL on the `reddit_app` database (**after** step 2, because `GRANT ... ON ALL TABLES` only covers tables that already exist):
```SQL
CREATE USER reddit_app_user WITH PASSWORD 'choose_a_strong_password';
GRANT CONNECT ON DATABASE reddit_app TO reddit_app_user;
GRANT USAGE ON SCHEMA public TO reddit_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO reddit_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reddit_app_user;

-- tables and sequences created by postgres in future get the same permissions automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO reddit_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO reddit_app_user;
```
4. Create a `backend/.env` file (never commit this file - it is listed in `.gitignore`) using the service account user you just created in `DATABASE_URL`:
```
DATABASE_URL=postgresql://reddit_app_user:choose_a_strong_password@localhost:5432/reddit_app
JWT_SECRET=a_long_random_string
PORT=5000
```
5. Start the backend in one terminal (leave it running):
```Powershell
cd backend
npm install
npm start
```
   You should see `Server running on port 5000`
6. Start the frontend in a second terminal from the root folder:
```Powershell
npm install
npm start
```

## Technologies
- React
- Redux
- Git/GitHub
- GitHub Projects
- ~~Reddit API~~ **
- Node.js
- Express
- SQL (PostgeSQL, MySQL)
- JWT tokens (as I already have log in state held in the front-end)
- HTML
- CSS
- JavaScript
- Jest
- Selenium
- Command line and file navigation

## Error Handling and Testing
Implemented error handling for:
- A bad login: an error is displayed when login fails due to incorrect credentials
- A validation error on sign up form: an error is displayed when sign up passwords do not match
- Like/Dislike count resets to 1 every time the button is clicked
- A user can add a like and a dislike at the same time
    - clicking like then dislike removes the like and adds a dislike instead (and vice versa)
- A user cannot add multiple likes/dislikes 
    - a second click of the button removes the like/dislike
- Every post in the feed isn't displaying the same data
- No posts/ a future API call returns nothing 
    - an intentional "no posts" message for the user so page doesn't look broken
- Missing fields when signing up or logging in (backend)
    - a 400 response with a "... are required" message
- The email or username is already in use when signing up (backend)
    - a 409 response with an "already in use" message
- A bad login (backend)
    - a 401 response with the same "Incorrect username or password" message whether the username doesn't exist or the password is wrong, so an attacker can't work out which usernames exist
- Any other server error during sign up or log in (backend)
    - a 500 response with a generic "Something went wrong" message; the real error is logged in the server terminal for debugging

App.test.js and auth.js are annotated. Please see the listed files for further details on each individual test. 

### Testing auth.js 
- Started the server using `node server.js` in one terminal and left it running, then sent requests from a second terminal
- Checked the server was reachable:
```Powershell
Invoke-RestMethod http://localhost:5000/api/health
```
- Tested sign up by running the below command in Powershell: 
```Powershell
$body = @{ username = 'testuser'; email = 'test@example.com'; password = 'Secret123!' } | ConvertTo-Json
Invoke-RestMethod http://localhost:5000/api/signup -Method Post -ContentType 'application/json' -Body $body
```
- Got back a token and a user object
- Tested login by running the below command in Powershell: 
```Powershell
$body = @{ username = 'testuser'; password = 'Secret123!' } | ConvertTo-Json
Invoke-RestMethod http://localhost:5000/api/login -Method Post -ContentType 'application/json' -Body $body
```
- Got back a new token and the user's details (without `password_hash`)
- Tested the error cases using a helper function so the status code and error message are printed instead of a red PowerShell exception:
```Powershell
function Test-Api($path, $data) {
  try {
    Invoke-RestMethod "http://localhost:5000/api/$path" -Method Post -ContentType 'application/json' -Body ($data | ConvertTo-Json)
  } catch {
    "$($_.Exception.Response.StatusCode.value__) $($_.ErrorDetails.Message)"
  }
}
```

| Test | Result |
|---|---|
| Sign up again with the same username and email | `409` "Username or email already in use" |
| Sign up with only a username | `400` "Username, email and password are required" |
| Log in with the wrong password | `401` "Incorrect username or password" |
| Log in with a username that doesn't exist | `401` with the same message as the wrong password |
| Log in without a password | `400` "Username and password are required" |

- Finally, checked in pgAdmin's Query Tool, ran `SELECT id, username, email, password_hash FROM users;` and checked that `password_hash` is a long string starting with `$2b$10$` (bcrypt with a cost factor of 10) and NOT the plain password

#### Issues found while testing
- **`relation "users" does not exist`** (500 "Something went wrong"): the tables hadn't been created yet. Fixed by running `backend/db/schema.sql` in pgAdmin's Query Tool on the `reddit_app` database
- **`permission denied for table users`** (500 "Something went wrong"): the tables were created as `postgres`, so `reddit_app_user` (the user in `DATABASE_URL`) had no access to them. Fixed by running the table and sequence `GRANT`s from How to Use, plus default privileges so tables created in future get the same permissions automatically:
```SQL
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO reddit_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO reddit_app_user;
```

## Future Work
- Get a custom domain name and use it for your application
- Set up a CI/CD workflow to automatically deploy your application when the master branch in the repository changes
- Make your application a progressive web app
