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
1. Set up the following environment variables: `DATABASE_URL`, `JWT_SECRET` and `PORT`
2. Run the following SQL query against your database:
```SQL
CREATE USER reddit_app_user WITH PASSWORD 'choose_a_strong_password';
GRANT CONNECT ON DATABASE reddit_app TO reddit_app_user;
GRANT USAGE ON SCHEMA public TO reddit_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO reddit_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reddit_app_user;
```
3. Use the service account user you just created in `DATABASE_URL`
4. Run `npm install` on root
5. Run `npm start` on root

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
- No posts/ a future API call retuns nothing 
    - an intentional "no posts" message for the user so page doesn't look broken
- The email or username is already in use when signing up 
    - a generic error message within the same process "something went wrong" for other types of errors that may occur during this process

App.test.js and auth.js are annotated. Please see the listed files for further details on each individual test. 

### Testing auth.js 
- Restarted the server using `node server.js` 
- Tested sign up by running the below command in Powershell: 
```Powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/signup -ContentType "application/json" -Body '{"username":"testuser","email":"test@example.com","password":"password123"}'
```
- Got back a token and a user object. Ran it a second time, got "already in use" error. 
- Tested login by running the below command in Powershell: 
```Powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/login -ContentType "application/json" -Body '{"username":"testuser","password":"password123"}'
```
- Tried a wrong password to confirm I got the 401
- Finally, checked in pgAdmin's Query Tool, ran `SELECT * FROM users;` and checked that `password_hash` is a long string starting with `$2b$` and NOT `password123`

## Future Work
- Get a custom domain name and use it for your application
- Set up a CI/CD workflow to automatically deploy your application when the master branch in the repository changes
- Make your application a progressive web app
