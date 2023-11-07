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
    origin: ['http://localhost:5173',],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 5555
// here are some code

/*-------------------Custom Middleware--------------------*/
const secret = process.env.SECRET;
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).send({ message: 'Token has expired. Please log in again.' });
            }
            console.log(err, 'inside verify token err');
            return res.status(401).send({ message: 'Unauthorized Access' });
        }
        // console.log('decoded,', decoded);
        req.user = decoded;
        next();
    })
}

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

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            // console.log('jwt', user);
            const token = jwt.sign(user, secret, { expiresIn: '24h' })
            // console.log(token);
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 1);
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    expires: expirationDate
                })
                .send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            // console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
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

        app.get('/api/v1/review', async(req, res) => {
            const roomId = req.query.roomId;
            const userEmail = req.query.email;
            console.log('api/v1/review:email:roomId,get', roomId, userEmail);
            const filter = {
                $and: [
                    {
                       roomId: roomId 
                    },
                    {
                        userEmail: userEmail
                    }
                ]
            }
            const result = await reviewCollection.find(filter).toArray();
            res.send(result);
        })

        /*** Booking API ***/
        // http://localhost:5555/api/v1/booking (POST)
        const bookingCollection = client.db('HotelBooking').collection('booking');
        app.post('/api/v1/booking', verifyToken, async (req, res) => {
            const { bookingDate, roomImage, roomId, roomDescription, pricePerNight, userEmail } = req.body;
            if (req.body.userEmail !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            // console.log(bookingDate, roomId);
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

        app.patch('/update-date', async (req, res) => {
            const { newDate, userEmail, id } = req.body;
            const dateNew = newDate + "";
            const filter = {
                $and: [
                    { _id: new ObjectId(id) },
                    { userEmail: userEmail }
                ]
            }
            const updatedBooking = {
                $set: {
                    bookingDate: dateNew
                }
            }
            const result = await bookingCollection.updateOne(filter, updatedBooking);
            res.send(result);
        })

        

        app.patch('/update-room/:id', async (req, res) => {
            const roomId = req.params.id;
            const { rating } = req.body;
            // console.log('update-room rating patch',rating);
            const filter = {
                _id: new ObjectId(roomId)
            }
            const update = {
                $inc: {
                    count_stars: parseFloat(rating),
                    count_reviews: 1
                }
            };
            const result = await roomCollection.updateOne(filter, update);
        })

        app.patch('/edit/patch/req/:id', async(req, res) => {
            const roomId = req.params.id;
            const {rating_count, stars_count} = req.body;
            const pathData = {
                count_reviews: parseInt(rating_count),
                count_stars: parseFloat(stars_count)
            }
            console.log('api/v1/patch req', pathData);
            res.send({});
        })

        app.get('/api/v1/booking', async (req, res) => {
            const { date, id } = req.query;
            // console.log(date, id);

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

        app.get('/api/v1/all-booking', verifyToken, async (req, res) => {
            console.log(req.query.email, 'req.email');
            console.log(req.user.email, 'user mail');
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            } else {
                console.log('verified  ...');
            }
            const email = req.query.email;
            const filter = { userEmail: email }
            const result = await bookingCollection.find(filter).toArray();
            res.send({ result });
        });

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
            // console.log(userEmail, roomId);
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

        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { roomId: id }
            const result = await reviewCollection.find(filter).toArray();
            res.send(result);
        })

        app.get('/api/v1/singlereview', verifyToken, async (req, res) => {
            const userEmail = req.query.userEmail;
            if (req.query.userEmail !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const roomId = req.query.roomId;
            // console.log(userEmail, roomId);

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

        app.delete('/delete-review/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteMany(filter);
            res.send(result);
        })

        // tricky delete
        app.put('/delete-review/:id', verifyToken, async (req, res) => {
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
            // console.log(filter);
            const options = { upsert: true };
            const result = await newsletterCollection.updateOne(filter, newsLetter, options);
            res.send(result);
        })

        
        /** Add Review **/
        app.post('/api/v1/add-review', verifyToken, async (req, res) => {
            const { review, rating, userName, userEmail, photoURL, date, roomId, profession } = req.body;
            if (req.body.userEmail !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const feedback = {
                review, rating, userName, userEmail, photoURL, date, roomId, profession
            }

            // console.log(feedback);
            const result = await reviewCollection.insertOne(feedback);
            res.send(result);
        })

        app.put('/api/v1/add-review', verifyToken, async (req, res) => {
            const { review, rating, userName, userEmail, photoURL, date, roomId, profession } = req.body;
            if (req.body.userEmail !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
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
            // console.log(feedback);
            const options = { upsert: true }
            const result = await reviewCollection.updateOne(filter, feedback, options);
            res.send(result);
        })

        app.get('/review/checking', async(req, res) => {
            const id = req.query.id;
            const email = req.query.email;
            console.log(id, email, 'cloll...');
            const filter = {
                $and: [
                    {userEmail: email},
                    {roomId: id}
                ]
            }
            const result = await bookingCollection.find(filter).toArray();
            res.send({data:result});
        })

        /*-------------------API End--------------------*/
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally { }
}
run().catch(console.dir);
/*-------------------MongoDB End--------------------*/


app.get('/', (req, res) => {
    // console.log(new Date());
    res.send('base route hit detected!!!');
})

app.listen(port, (req, res) => {
    console.log('server is running...');
})