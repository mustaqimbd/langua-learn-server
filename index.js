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
        const usersCollection = client.db('langua_db').collection('users')
        const classesCollection = client.db('langua_db').collection('classes')
        app.get('/', (req, res) => {
            res.send('The server is running')
        })

        app.post('/user', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.findOne({ email: user.email })
            if (result) {
                return res.send({ message: 'User already exits' })
            } else {
                const result = await usersCollection.insertOne(user)
                res.send(result)
            }
        })
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })
        app.get('/instructors', async (req, res) => {
            const result = await usersCollection.find({ role: 'Instructor' }).toArray()
            res.send(result)
        })
        app.get('/user-role/:email', async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email: email })
            res.send(result)
        })
        app.patch('/update/user/:role', async (req, res) => {
            const role = req.params.role;
            const email = req.body;
            const user = await usersCollection.findOne(email)
            user.role = role;
            if (user) {
                const updateDoc = { $set: { role: role } }
                const result = await usersCollection.updateOne(email, updateDoc)
                res.send(result)
            }
        })
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query)
            res.send(result)
        })

        app.post('/newclass', async (req, res) => {
            const newClass = req.body;
            console.log(newClass);
            const result = await classesCollection.insertOne(newClass);
            res.send(result)
        })
        app.get('/my-classes/:email', async (req, res) => {
            const email = req.params.email;
            const result = await classesCollection.find({ instructorEmail: email }).toArray()
            res.send(result)
        })
        app.get('/my-class/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await classesCollection.findOne(query)
            res.send(result)
        })
        app.delete('/delete-my-class/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await classesCollection.deleteOne(query)
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