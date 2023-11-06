// importing package's
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const app = express();

/**** JSON Web Token ****/
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 5555


/*-------------------MongoDB Start--------------------*/
const secret = process.env.SECRET;
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

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, secret, { expiresIn: '24h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    expires: new Date(Date.now() + 90000000)
                })
                .send({ success: true });
        })

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
            res.send({ result });
        });

        app.get('/api/v1/all-booking', async (req, res) => {
            const email = req.query.email;
            const filter = { userEmail: email }
            const result = await bookingCollection.find(filter).toArray();
            res.send({ result });
        });

        /** booking **/
        // app.get('/api/v1/all-booking', async(req, res) => {
        //     const email = req.query.email;
        //     console.log(email);
        //     res.send('sending')
        // })

        /**** Sliders API ***/
        const sliderCollection = client.db('HotelBooking').collection('sliders');
        app.get('/api/v1/sliders', async (req, res) => {
            const result = await sliderCollection.find().toArray();
            res.send(result)
        })

        /***** Reviews API *****/
        // /api/v1/reviews?userEmail=&roomId
        const reviewCollection = client.db('HotelBooking').collection('reviews');
        app.get('/api/v1/reviews', async (req, res) => {
            const userEmail = req.query.userEmail;
            const roomId = req.query.roomId;
            console.log(userEmail, roomId);
            let filter = {}
            if (userEmail & roomId) {
                filter = {
                    $and: [
                        {
                            userEmail: userEmail
                        },
                        {
                            roomId: roomId
                        }
                    ]
                }
            }
            const result = await reviewCollection.find(filter).toArray();
            res.send(result);
        })

        app.get('/api/v1/singlereview', async (req, res) => {
            const userEmail = req.query.userEmail;
            const roomId = req.query.roomId;
            console.log(userEmail, roomId);

            const filter = {
                $and: [
                    {
                        userEmail: userEmail
                    },
                    {
                        roomId: roomId
                    }
                ]
            }

            const result = await reviewCollection.find(filter).toArray();
            res.send(result);
        })

        app.delete('/delete-review/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteMany(filter);
            res.send(result);
        })

        // tricky delete
        app.put('/delete-review/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: new ObjectId(id)
            }
            const data = {
                $set: {
                    userEmail: 'deleted',
                    roomId: '---'
                }
            }
            const options = { upsert: true };
            const result = await bookingCollection.updateOne(filter, data, options);
            res.send(result);
        })


        /** News Letter API's **/
        const newsletterCollection = client.db('HotelBooking').collection('newsletters');
        app.put('/api/v1/newsletter', async (req, res) => {
            const userName = req.body.name;
            const userEmail = req.body.email;
            const filter = {
                userName,
                userEmail
            }
            const newsLetter = {
                $set: {
                    userName: userName,
                    userEmail: userEmail
                }
            }
            console.log(filter);
            const options = { upsert: true };
            const result = await newsletterCollection.updateOne(filter, newsLetter, options);
            res.send(result);
        })

        // rating,
        //     review,
        //     userName,
        //     photoURL,
        //     date,
        //     userEmail,
        //     roomId
        /** Add Review **/
        app.put('/api/v1/add-review', async (req, res) => {
            const { review, rating, userName, userEmail, photoURL, date, roomId, profession } = req.body;
            const filter = {
                $and: [
                    { roomId: roomId },
                    { userEmail: userEmail }
                ]
            }

            const feedback = {
                $set: {
                    review, rating, userName, userEmail, photoURL, date, roomId, profession
                }
            }
            console.log(feedback);
            const options = { upsert: true }
            const result = await reviewCollection.updateOne(filter, feedback, options);
            res.send(result);
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