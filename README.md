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
1. Run `npm install` on root
2. Run `npm start` on root

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

App.test.js is annotated. Please see that for further details on each individual test. 

## Future Work
- Get a custom domain name and use it for your application
- Set up a CI/CD workflow to automatically deploy your application when the master branch in the repository changes
- Make your application a progressive web app
