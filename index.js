const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const admin = require("firebase-admin");
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.stsuc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const port = 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var serviceAccount = require("./configs/burj-al-aaarab-firebase-adminsdk-86f21-3ff9e33588.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_FIRE
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookingCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLLECTION}`);

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookingCollection.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log({ idToken });
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail == req.query.email) {
            bookingCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              });
          }
          else{
            res.status(401).send('Un-authorized Access');
          }
        })
        .catch((error) => {
          // Handle error
          res.status(401).send('Un-authorized Access');
        });
    }
    else{
      res.status(401).send('Un-authorized Access');
    }
  });
});

app.get("/", (req, res) => {
  res.send("Burj Al Arab Server");
});

app.listen(port);
