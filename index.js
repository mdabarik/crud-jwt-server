// importing package's
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const moment = require('moment');

// server app
const app = express();
app.use(express.json());
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
        app.get('/api/v1/rooms', async (req, res) => {
            let queryFilter = {};
            let sortObj = {};

            const filterByPrice = req.query.filterByPrice;
            const sortField = req.query?.sortField;
            const sortOrder = req.query?.sortOrder;

            if (filterByPrice != "") {
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

            if (sortField && sortOrder && sortField != "" && sortOrder != "") {
                sortObj[sortField] = sortOrder;
                console.log('hello');
            } else {
                const noSortResult = await roomCollection.find(queryFilter).toArray();
                res.send(noSortResult)
                return;
            }

            const result = await roomCollection.find(queryFilter).sort(sortObj).toArray();
            res.send(result);
        })

        app.get('/api/v1/rooms/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await roomCollection.findOne(filter)
            res.send(result);
        })

        /*** Booking API ***/
        // http://localhost:5555/api/v1/booking (POST)
        const bookingCollection = client.db('HotelBooking').collection('booking');
        app.post('/api/v1/booking', async (req, res) => {
            const { bookingDate, roomImage, roomId, roomDescription, pricePerNight, userEmail } = req.body;
            console.log(bookingDate, roomId);
            const newBooking = {
                roomId,
                roomDescription,
                pricePerNight,
                bookingDate,
                roomImage,
                userEmail
            }
            const result = await bookingCollection.insertOne(newBooking);
            res.send(result);
        })

        app.get('/api/v1/booking', async (req, res) => {
            const { date, id } = req.query;
            console.log(date, id);

            const newDate = date + "";

            const filter = {
                $and: [
                    {
                        roomId: id
                    },
                    {
                        bookingDate: newDate
                    }
                ]
            }

            const result = await bookingCollection.find(filter).toArray();
            res.send({result});
        });

        app.get('/api/v1/all-booking', async (req, res) => {
            const result = await bookingCollection.find().toArray();
            res.send({result});
        });


        // app.get('/api/v1/booking', async(req, res) => {
        //     const id = req.query.room_id;
        //     const date = dayjs(req.query.date);
        //     const day = date.date();
        //     const month = date.month() + 1; 
        //     const year = date.year();

        //     console.log(day, month, year);

        //     const filter = {
        //         $expr: {
        //             $and: [
        //               { $eq: [{ $dayOfMonth: "$booking_date" }, day] },
        //               { $eq: [{ $month: "$booking_date" }, month] }, 
        //               { $eq: [{ $year: "$booking_date" }, year] },
        //               {room_id: id},
        //             ]
        //           }
        //     }
        //     console.log(filter);
        //     const result = await bookingCollection.findOne(filter);
        //     res.send(result);
        //     // const email = req.query.email;
        //     // if (!email) {
        //     //     res.status(403).send('Forbidden');
        //     //     return;
        //     // }
        //     // const query = { user_email: email };
        //     // const result = await bookingCollection.find(query).toArray();
        //     // return res.send(result);
        // })

        app.get('/api/v1/reviews', async (req, res) => {
            res.send('reviews all')
        })

        app.get('/api/v1/reviews/:id', (req, res) => {

        })

        /**** Sliders API ***/
        const sliderCollection = client.db('HotelBooking').collection('sliders');
        app.get('/api/v1/sliders', async (req, res) => {
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
    console.log(new Date());
    res.send('base route hit detected!!!');
})

app.listen(port, (req, res) => {
    console.log('server is running...');
})

/* Booking post
{
    "_id"
    "room_id"
    "room_description"
    "price_per_night"
    "booking_date"
    "upto_cancel_date"
    "room_image"
    "user_email"˝
  } */


/*
const dayjs = require('dayjs');

const url = 'mongodb://localhost:27017';
const dbName = 'your_database_name';

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
  if (err) throw err;

  const db = client.db(dbName);

  const currentDate = dayjs().toISOString();

  db.collection('dates').find({ date: { $gt: currentDate } }).toArray((err, result) => {
    if (err) throw err;
    console.log('Documents where date is after the current date:', result);
    client.close();
  });
}) */