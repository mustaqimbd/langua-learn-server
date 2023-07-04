const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.Payment_secret_key);

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.znibnea.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("langua_db").collection("users");
    const classesCollection = client.db("langua_db").collection("classes");
    app.get("/", (req, res) => {
      res.send("The server is running");
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.findOne({ email: user.email });
      if (result) {
        return res.send({ message: "User already exits" });
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.get("/instructors", async (req, res) => {
      const result = await usersCollection
        .find({ role: "Instructor" })
        .toArray();
      res.send(result);
    });
    app.get("/user-role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email: email });
      res.send(result);
    });
    app.patch("/update/user/:role", async (req, res) => {
      const role = req.params.role;
      const email = req.body;
      const user = await usersCollection.findOne(email);
      user.role = role;
      if (user) {
        const updateDoc = { $set: { role: role } };
        const result = await usersCollection.updateOne(email, updateDoc);
        res.send(result);
      }
    });
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/all-classes", async (req, res) => {
      const query = req.query;
      if (query) {
        const result = await classesCollection.find(query).toArray();
        res.send(result);
      } else {
        const result = await classesCollection.find().toArray();
        res.send(result);
      }
    });

    app.patch("/all-classes/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const updateDoc = { $set: status };
      const result = await classesCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      res.send(result);
    });
    app.post("/newclass", async (req, res) => {
      const newClass = req.body;
      console.log(newClass);
      const result = await classesCollection.insertOne(newClass);
      res.send(result);
    });
    app.patch("/update-class/:id", async (req, res) => {
      const id = req.params.id;
      const newClass = req.body;
      console.log(id, newClass);
      const updateDoc = { $set: newClass };
      const result = await classesCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      res.send(result);
    });
    app.get("/my-classes/:email", async (req, res) => {
      const email = req.params.email;
      const result = await classesCollection
        .find({ instructorEmail: email })
        .toArray();
      res.send(result);
    });
    app.get("/my-class/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    });
    app.delete("/delete-my-class/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.deleteOne(query);
      res.send(result);
    });
    app.patch("/selected-classes/:email", async (req, res) => {
      const email = req.params.email;
      let selectedId = req.body.id;
      const deleteId = req.body.deleteId;
      const user = await usersCollection.findOne({ email: email });
      const filter = { email: email };
      if (deleteId) {
        const remainingId = user.selectedClasses?.filter(
          (id) => id !== deleteId
        );
        const updateDoc = {
          $set: {
            selectedClasses: remainingId,
          },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        return res.send(result);
      }
      if (user.selectedClasses) {
        const updateDoc = {
          $set: {
            selectedClasses: [...user.selectedClasses, selectedId],
          },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        const updateDoc = {
          $set: {
            selectedClasses: [selectedId],
          },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    });
    app.get("/selected-classes", async (req, res) => {
      const query = req.query;
      if (query.selectedClasses) {
        const selectedIds = query.selectedClasses;
        const ids = { _id: { $in: selectedIds.map((id) => new ObjectId(id)) } };
        const result = await classesCollection.find(ids).toArray();
        res.send(result);
      }
    });
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      console.log("price", amount);
      const paymentIntent = await stripe.paymentIntents.create({
        description: "Software development services",
        shipping: {
          name: "Jenny Rosen",
          address: {
            line1: "510 Townsend St",
            postal_code: "98140",
            city: "San Francisco",
            state: "CA",
            country: "US",
          },
        },
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`The server is running on ${port} port`);
});
