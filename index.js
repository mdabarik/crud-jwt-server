// importing package's
const express = require('express');

// server app
const app = express();
const port = process.env.PORT || 5555

app.get('/', (req, res) => {
    res.send('base route hit detected!!!');
})

app.listen(port, (req, res) => {
    console.log('server is running...');
})