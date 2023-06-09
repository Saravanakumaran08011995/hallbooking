import  express  from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;
async function createconnection() {
  const client = new MongoClient(MONGO_URL)
  await client.connect();
  return client;
}
//all the data from database
app.get("/", async (request, response) => {
    const client = await createconnection();
    const result = await client.db("halls").collection("hall").find().toArray();
    response.send(result);
});
//creates room
app.post("/roomcreate", async (request, response) => {
    const roomData = request.body;
    /* data format sent in body would be as below
{
    "PricePerHr": 500,
    "ameneties": "Fully Air Conditioned",
    "bookStatus": false,
    "seats": 7,
    "roomName": "E1"
}
*/
    const client = await createconnection();
    const result = await client.db("halls").collection("hall").insertOne(roomData);

    response.send(result);
});
//books room if available
app.put("/roombook", async (request, response) => {
    const userData = request.body;
    /* dta format sent in body would be as below
    
  {
    "bookingDetails": {
      "date": "2021-10-01T12:25:34.207Z",
      "name": "John",
      "startTime": "2021-10-02T19:42:29.280Z",
      "endTime": "2021-10-03T07:42:06.270Z"
    },
    "roomName": "HALL2"
  }
     */
    const client = await createconnection();
    const result = await client.db("halls").collection("hall").find({
        roomName: userData.roomName
      }).toArray();
      if (result[0].bookStatus==true){      //if room is booked
        let  message = "room not available";
        response.send(message);
      }
      else {
       let message = await client.db("halls").collection("hall") .updateOne({
        roomName :userData.roomName,   //filters the room by name
      },
      { $set : { bookStatus : true,  "bookingDetails": userData.bookingDetails } }  //adds booking details to the room
     )
       response.send(message);
      }; 
})

app.get("/roomslist", async (request, response) => {
    const client = await createconnection();
    const result = await client.db("halls").collection("hall")
    .aggregate([
        {
            $project: {
              roomName: 1,
              bookStatus: 1,
              customerName: "$bookingDetails.name",
              date: "$bookingDetails.date",
              startTime: "$bookingDetails.startTime",
              endTime: "$bookingDetails.endTime",
              _id: 0
            }
          }
    ])
    .toArray();

    response.send(result);
})

app.get("/customerslist", async (request, response) => {
    const client = await createconnection();
    const result = await client.db("halls").collection("hall")
    .aggregate([
        {
            "$match": {
              bookStatus: true
            }
          },
          {
            $project: {
              roomName: 1,
              customerName: "$bookingDetails.name",
              date: "$bookingDetails.date",
              startTime: "$bookingDetails.startTime",
              endTime: "$bookingDetails.endTime",
              _id: 0
            }
          }
    ])
    .toArray();
    response.send(result);
});
app.listen(PORT || 5000 , () => console.log("The server is started"));