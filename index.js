const express = require("express")
const app = express();
require('dotenv').config();
const cors = require('cors');
const port =process.env.port || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// MiddleWare 

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m1npfxh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db('parcel-management').collection("users");
    const bookParclesCollection = client.db('parcel-management').collection('book_parcles');
    const paymentCollection = client.db('parcel-management').collection('payments');

    //  User Related API 
    app.post("/users",async(req,res)=>{
        const user = req.body;
        const email = {email : user.email};
        const existingUser = await userCollection.findOne(email);
        if(existingUser){
          return res.send({message: "User ALreday Exists", insertedId:null});
        }
        const result =await userCollection.insertOne(user);
        res.send(result);
    })

    app.get("/users", async(req,res)=>{
       
        
        const result = await userCollection.find().toArray();
        
        res.send(result);
    })

    // Admin Related API
    app.get("/users/admin/:email", async(req,res)=>{
        const email = req.params.email;
        const query ={email : email};
        const result = await userCollection.findOne(query);
        let admin = false;
        if(result){
            admin = result?.role === "Admin";
        }
        res.send({admin})
    })
    app.get("/allParcels",async(req,res)=>{
      const result = await bookParclesCollection.find().toArray();
      res.send(result);
    })

      app.patch('/users/deliveryMen/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'Delivery_men'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
     app.patch('/users/Makeadmin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'Admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.get('/updateParcle/:id',async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const query = {_id: new ObjectId(id) }
      const result = await bookParclesCollection.findOne(query);
      res.send(result);
    })

      app.patch('/bookParcels/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      console.log(id,item);
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          Name : item.Name,
          Email : item.Email,
          Phone_Number : item.Phone_Number ,
          Parcel_Type :item.Parcel_Type,
          Parcel_weight:item.Parcel_weight,
          Receiver_name:item.Receiver_name,
          Receiver_number:item.Receiver_number,
          Delivery_Address:item.Delivery_Address,
          Requested_delivery_time:item.Requested_delivery_time,
          Delivery_Latitude:item.Delivery_Latitude,
          Delivery_Logtitude:item.Delivery_Logtitude,
          Price: item.Price,
          status :"pending",
        }
      }

      const result = await bookParclesCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })

    // ALl Delivery Men 
    app.get("/allDeliveryMen", async(req,res)=>{
      const result = await userCollection.find().toArray();
      const data = result.filter(deli=> deli.role == "Delivery_men");
      res.send({data})
  })

    // Star and Analytics 
    app.get('/static', async(req,res)=>{
      const users = await userCollection.estimatedDocumentCount();
      const book_parcles = await bookParclesCollection.estimatedDocumentCount();
      res.send({users,book_parcles});
    })

    // User Realted API 
    app.get("/users/user/:email", async(req,res)=>{
        const email = req.params.email;
        const query ={email : email};
        const result = await userCollection.findOne(query);
        let user = false;
        if(result){
            user = result?.role === "User";
        }
        res.send({user})
    })

    // Book Parcles API
    app.post("/bookParcels",async(req,res)=>{
      const data = req.body;
      const result = await bookParclesCollection.insertOne(data);
      res.send(result);
      
    })
    

    app.get("/myParcles/:email",async(req,res)=>{
      const email = req.params.email;
      const query ={Email :email}
      console.log(query);
      const result = await bookParclesCollection.find(query).toArray();
      res.send({result});
    })

   


    // Delivery Men Realted API 
    app.get("/users/deliveryMen/:email", async(req,res)=>{
        const email = req.params.email;
        const query ={email : email};
        const result = await userCollection.findOne(query);
        let deliveryMen = false;
        if(result){
            deliveryMen = result?.role === "Delivery_men";
        }
        res.send({deliveryMen})
    })

    app.patch('/deliveryMen/:parcelId', async (req, res) => {
      const parcelId = req.params.parcelId;
      const data = req.body;
      // console.log(data);
      // console.log(parcelId);
      
      const filter = {_id: new ObjectId(parcelId)};
      const updatedDoc = {
        $set: {
          DeliveryMen_id: data.deliveryMenId,
          status : data.status
        }
      }
      const result = await bookParclesCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

      // My Delivery List Realted API 
    //   app.get("/users/myDeliveryList/:email", async(req,res)=>{
    //     const email = req.params.email;
    //     // console.log(email);
    //     const query ={email : email};
    //     const result = await userCollection.findOne(query);
    //     const resultId =result._id;
    //     console.log(resultId);
    //     const userId = resultId.slice(14,38);
    //     // const query2 ={ DeliveryMen_id : userId}
    //   console.log(userId);
        
    // })

      // carts collection
      app.get('/carts', async (req, res) => {
        const email = req.query.email;
        const query = { Email: email };
       
        const result = await bookParclesCollection.find(query).toArray();
        res.send(result);
      });
  
        // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
   

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types:['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });


      // Payments 
      app.post('/payments', async (req, res) => {
        const payment = req.body;
        const paymentResult = await paymentCollection.insertOne(payment);

        res.send({ paymentResult});
      })
      // Update UProfile 
      app.patch("/updateProfile/:email", async(req,res)=>{
        const data = req.body;
        
        const email = req.params.email;
        console.log(email);
        const filter = {email : email};
        const updateOne ={
          $set:{
            "phoneNumber" : data.phoneNumber
          }
        }
        const result = await userCollection.updateOne(filter,updateOne);
        res.send(result)
      })
    

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',async(req,res)=>{
    res.send("Hello World");
});


app.listen(port,()=>{
    console.log(`Parcel Management App Lising on Port ${port}`);
})