const dotenv = require("dotenv");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");

// ___________step 1___for jwt and cookies storage

var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


const app = express();
const PORT = process.env.PORT || 5000;



// Middleware
// ___________step 2___for jwt and cookies storage
app.use(cors(
  {
    origin: [
      "http://localhost:4173",
      "http://localhost:5173",
      "https://job-seeker-d51b4.web.app",
    
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],

    credentials: true
  }
));



app.use(express.json());

// ___________step 3___for jwt and cookies storage
app.use(cookieParser());


// ________________________middle ware

const logger = async( req, res, next)=>{
  console.log("Inside the logger");

  next();
}



// ___________step 5___for jwt and cookies storage

const verifyToken = async (req, res, next)=>{
  console.log("Inside verify token middleware");
  const token = req?.cookies?.token;
  console.log(token);
  if(!token){
    return res.status(401).send({message : "Unauthorized Access"});
  }


  // verify the token
  jwt.verify(token, process.env.JWT_SECRET, (error, decoded)=>{
      if(error){
        return res.status(401).send({message : "Unauthorized Access"});
      }else{
        // console.log("Okay");
        req.user = decoded;
      }
      next();
  })
  
}
  
  



// Database connection

const uri = process.env.MONGO_URI;

// const uri = "mongodb://localhost:27017"

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});



async function run() {
  try {

    await client.connect();

    await client.db("admin").command({ ping: 1 });
    // Access the database and collections

    
    const db = client.db("humanity");
    const postVolunteerCollection = db.collection("postVolunteer");
    console.log("Successfully connected to MongoDB!");



    // auth related APIS


// ___________step 4___for jwt and cookies storage

    app.post("/jwt", async (req, res) => {
      const email = req.body.email; 
      const payload = { email }; // Create a payload object
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }); 
    
      res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        // secure: process.env.NODE_ENV === "production",
  
      })
      .send({ success: true}); 
    });



    app.post("/logout", async(req, res)=>{
       res.clearCookie("token",{
        httpOnly : true,
        // secure: process.env.NODE_ENV === "production",
  
       }).send({success: true});
    })





// ________________________________my posted job api 



 



    app.post("/post-for-volunteer", async (req, res) => {
      try {
        const data = req.body;
        // console.log(data)
        
        // const jobID = data.jobId;
        const result = await postVolunteerCollection.insertOne(data);

        if (result.acknowledged) {
          res.status(200).json({ success: true, message: "result added successfully" });
        }

         
      } catch (err) {
        console.error("Error inserting result:", err);
        res
          .status(500)
          .json({ message: "Failed to add result", error: err.message });
      }
    });





    app.get("/applied-job/:email", verifyToken, async (req, res) => {
      const email = req?.params?.email;
      // console.log(email);

      const query = { applicantEmail: email };
      // console.log("Cookies : ", req.cookies);


    // ___________step 6___for jwt and cookies storage

      if(req?.user?.email !== email){
        return res.status(403).json({ success: false, message: "forbidden access" });
      }

      try {
        const result = await jobApplicationCollection
          .find({ applicantEmail: email })
          .toArray();

        for (const item of result) {
          const job = await jobCollection.findOne({
            _id: new ObjectId(item.jobId),
          });
          if (job) {
            item.jobTitle = job.title;
            item.companyName = job.company;
            item.location = job.location;
            item.company_logo = job.company_logo;
          }
        }

        if (!result) {
          return res.status(404).json({ message: "result not found" });
        }
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error fetching result details" });
      }
    });








  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  } finally {
    // await client.close();
  }
}











run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Server is running");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
