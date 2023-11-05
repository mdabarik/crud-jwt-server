// importing package's
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()

// server app
const app = express();
const port = process.env.PORT || 5555


/*-------------------MongoDB Start--------------------*/
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.waijmz7.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        /*-------------------API Start--------------------*/
        const roomCollection = client.db('HotelBooking').collection('rooms');
        // http://localhost:5555/api/v1/rooms -- fetch all rooms
        // http://localhost:5555/api/v1/rooms?filter=1000-5000&sortField=price-per-night&sort=asc/desc -- fetch rooms by filtering and sorting
        // http://localhost:5555/api/v1/rooms?filter=1000-5000&sortField=price-per-night&sort=asc&page=1&limit=5 -- paginations (optional)
        app.get('/api/v1/rooms', async(req, res) => {
            const query = {};
            const result = await roomCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/api/v1/reviews', async(req, res) => {
            res.send('reviews all')
        })

        app.get('/api/v1/reviews/:id', (req, res) => {

        })

        const sliderCollection = client.db('HotelBooking').collection('sliders');
        app.get('/api/v1/sliders', async(req, res) => {
            const result = await sliderCollection.find().toArray();
            return result;
        })

        /*-------------------API End--------------------*/
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally { }
}
run().catch(console.dir);
/*-------------------MongoDB End--------------------*/


app.get('/', (req, res) => {
    res.send('base route hit detected!!!');
})

app.listen(port, (req, res) => {
    console.log('server is running...');
})