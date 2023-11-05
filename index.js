// importing package's
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const cors = require('cors');

// server app
const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
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
        // http://localhost:5555/api/v1/rooms?filterByPrice=1000-5000&sortField=price-per-night&sortOrder=asc/desc -- fetch rooms by filtering or/and sorting
        app.get('/api/v1/rooms', async(req, res) => {
            let queryFilter = {};
            let sortObj = {};

            const filterByPrice = req.query.filterByPrice;
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;
            console.log(filterByPrice, sortField, sortOrder);

            if (filterByPrice) {
                const interval = filterByPrice.split("-");
                const lowerLimit = parseInt(interval[0]);
                const upperLimit = parseInt(interval[1]);

                queryFilter = {
                    price_per_night: {
                        $gte: lowerLimit,
                        $lte: upperLimit
                    }
                };
            }
            
            if (sortField && sortOrder) {
                sortObj[sortField] = sortOrder;
            }

            const result = await roomCollection.find(queryFilter).sort(sortObj).toArray();
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
            res.send(result)
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