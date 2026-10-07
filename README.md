# Codecademy Off-Platform Project: Reddit App

## Description
A Reddit clone application using React and Redux. The application will allow users to view and search posts and comments provided by its own API (Node.js, Express and PostgreSQL).
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

### Built so far
- Sign up and log in with real accounts (passwords hashed with bcrypt, logins proven with a JWT that lasts 7 days)
- Staying logged in after a page refresh, until the token expires
- Logging out automatically the moment the token expires, with a "session expired" notice (the user stays on the page they were reading)
- A feed of posts loaded from the database, newest first, with loading and error states and a **Try again** button
- Search posts by heading, and filter them by category (both work together)
- "Most Visited" shows posts from every category, ordered by total likes and dislikes
- Create a post (logged in users only) with a heading, content and category
- Like and dislike posts - one reaction per user per post, saved on the server, with the user's own reaction highlighted
- Read the comments on a post in a modal, and add comments when logged in
- Logged out users who try to react or comment are sent to the login form

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
7. *(Optional)* Fill the database with sample users, posts, reactions and comments. From the `backend` folder:
```Powershell
npm run seed
```
   This creates the users `gamer_gemma`, `tech_tom` and `foodie_fran` (all with the demo password `password123`) and 12 posts across different categories, with likes, dislikes and comments. It's safe to run more than once - it removes its previous sample data first rather than duplicating it.

### Running the tests
**Frontend** (React Testing Library + Jest) - from the root folder:
```Powershell
npm test
```

**Backend** (Jest + Supertest against a real database) - the backend tests use a **separate** database so they never touch real data:
1. Create a second database called `reddit_app_test`, run `backend/db/schema.sql` on it as `postgres`, then run the same `GRANT` and `ALTER DEFAULT PRIVILEGES` SQL from step 3 with `reddit_app` replaced by `reddit_app_test` in the `GRANT CONNECT` line
2. Create `backend/.env.test` (also gitignored) - the same as `.env` but pointing at the test database:
```
DATABASE_URL=postgresql://reddit_app_user:choose_a_strong_password@localhost:5432/reddit_app_test
JWT_SECRET=any_long_random_string_just_for_tests
```
3. From the `backend` folder:
```Powershell
npm test
```
   The tests empty every table before each test, so `backend/tests/helpers.js` refuses to run at all unless the database name ends in `_test`.

## API
All routes start with `/api`. "Token" means the request needs an `Authorization: Bearer <token>` header from signing up or logging in.

| Method | Route | Token | What it does |
|---|---|---|---|
| `GET` | `/api/health` | No | Checks the server is running |
| `POST` | `/api/signup` | No | Creates an account from `{ username, email, password }` and returns `{ token, user }` |
| `POST` | `/api/login` | No | Checks `{ username, password }` and returns `{ token, user }` |
| `GET` | `/api/posts` | Optional | Every post, newest first, with the author, like/dislike counts and (when a token is sent) the viewer's own `userReaction` |
| `POST` | `/api/posts` | Yes | Creates a post from `{ postHeading, content, category }` - the author is taken from the token |
| `POST` | `/api/posts/:id/reactions` | Yes | Sends `{ type: 'like' \| 'dislike' }` - adds, removes or switches the user's reaction and returns `{ likes, dislikes, userReaction }` |
| `GET` | `/api/posts/:id/comments` | No | A post's comments, oldest first |
| `POST` | `/api/posts/:id/comments` | Yes | Adds a comment from `{ content }` - the commenter is taken from the token |

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
- bcrypt (password hashing)
- React Router
- React Testing Library
- Supertest (backend API tests)
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
    - these rules now live on the server (`POST /api/posts/:id/reactions`) and are backed up by a `UNIQUE(post_id, user_id)` rule in the database, so they apply to everyone and survive a refresh
- Every post in the feed isn't displaying the same data
- The feed can't be loaded (backend not running, or a server error)
    - a "Could not load posts" message with a **Try again** button, rather than a misleading "no posts" message
    - a "Loading posts..." message while waiting, so the page never looks empty or broken
- A logged out user tries to like, dislike or comment
    - they're sent to the login form instead of the request failing
- A saved token has expired or isn't a real JWT when the page is refreshed
    - the app starts logged out instead of showing "Log out" to someone the server would reject
- The token expires while the app is open
    - a timer set for the token's `exp` logs the user out at that moment and shows a dismissible notice; logging out by hand cancels the timer so the notice never appears by mistake
- Creating a post or comment with empty fields
    - caught in the browser before anything is sent, and checked again on the server (400)
- A post's category isn't one of the category buttons (backend)
    - a 400 response, so every post can always be found with the category filter
- A request to a protected route with no token, a fake token or an expired token (backend)
    - a 401 response from the `requireAuth` middleware
- Someone tries to post or comment as another user (backend)
    - any `postedBy` sent in the request is ignored - the author always comes from the verified token
- A reaction or comment on a post that doesn't exist (backend)
    - a 404 "Post not found" response
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

### Automated tests
The project is built test-first (TDD): each feature starts as failing tests, then the code is written to make them pass.

| Suite | Where | Tests | Covers |
|---|---|---|---|
| Frontend | `src/App.test.js` | 80 | Search, login/sign up/logout, staying logged in after a refresh, logging out when the token expires, loading the feed, creating posts, reactions, comments, the category filter, Most Visited |
| Backend | `backend/tests/posts.test.js` | 10 | Reading the feed and creating posts (including auth and validation) |
| Backend | `backend/tests/reactions.test.js` | 15 | Adding, removing and switching reactions, and `userReaction` in the feed |
| Backend | `backend/tests/comments.test.js` | 12 | Reading and adding comments (including auth and validation) |

The frontend tests replace `fetch` with a Jest mock so they never need the backend running. The backend tests send real HTTP requests to the Express app with Supertest and run real SQL against the `reddit_app_test` database.

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

#### Issues found while building the rest of the app
- **The frontend test suite wouldn't load at all** (`Cannot find module 'react-router/dom'`, then `TextEncoder is not defined`): Create React App's Jest doesn't understand React Router v7's package setup. Fixed with a `moduleNameMapper` entry in `package.json` and a `TextEncoder` polyfill in `src/setupTests.js`. Once the suite could run, it revealed 8 older tests that had been silently broken, which were then fixed
- **`.env.test` accidentally pointed at the real database**: caught by the safety check in `backend/tests/helpers.js` before any data was deleted
- **`Proxy error: Could not proxy request /index.css`**: a leftover `<link href="index.css">` in `public/index.html` - the styles are already bundled through `src/index.js`, so the line was removed
- **A test that passed by accident**: a typo (`setsPostsError`) threw an error that the `catch` block turned into the expected message. Spotted by reading the code, not the test result - a reminder that a `try`/`catch` catches your own mistakes too

## Future Work
- Make the Share link (`/post/:id`) open the post - it's copied to the clipboard but there's no route for it yet
- Get a custom domain name and use it for your application
- Set up a CI/CD workflow to automatically deploy your application when the master branch in the repository changes
- Make the application a progressive web app
