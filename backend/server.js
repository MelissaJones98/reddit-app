const express = require('express');
const cors = require('cors'); // the middleware that controls which websites are allowed to make request to this server from a browser
require('dotenv').config(); // loads .env file 

const app = express(); // calling express creates the application object 
app.use(cors()); // "app" is what routes and middleware are attached to and is listening for requests - everything builds on top of "app"
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});