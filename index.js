// importing package's
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');


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