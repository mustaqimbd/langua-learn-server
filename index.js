const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

//Middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.znibnea.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const users = client.db('langua_db').collection('users')
        app.get('/', (req, res) => {
            res.send('The server is running')
        })

        app.post('/user', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await users.findOne({ email: user.email })
            if (result) {
                return res.send({ message: 'User already exits' })
            } else {
                const result = await users.insertOne(user)
                res.send(result)
            }
        })
        app.get('/users', async (req, res) => {
            const result = await users.find().toArray()
            res.send(result)
        })
        app.get('/user-role/:email', async (req, res) => {
            const email = req.params.email;
            const result = await users.findOne({ email: email })
            res.send(result)
        })
        app.patch('/update/user/:role', async (req, res) => {
            const role = req.params.role;
            const email = req.body;
            const user = await users.findOne(email)
            user.role = role;
            if (user) {
                const updateDoc = { $set: { role: role } }
                const result = await users.updateOne(email, updateDoc)
                res.send(result)
            }
        })
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await users.deleteOne(query)
            res.send(result)
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`The server is running on ${port} port`);
})