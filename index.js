const dotenv = require("dotenv");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");

// ___________step 1___for jwt and cookies storage

var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// ___________step 2___for jwt and cookies storage
app.use(
  cors({
    origin: [
      "http://localhost:4173",
      "http://localhost:5173",
      "https://job-seeker-d51b4.web.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],

    credentials: true,
  })
);

app.use(express.json());

// ___________step 3___for jwt and cookies storage
app.use(cookieParser());

// ________________________middle ware

const logger = async (req, res, next) => {
  console.log("Inside the logger");

  next();
};

// ___________step 5___for jwt and cookies storage

const verifyToken = async (req, res, next) => {
  console.log("Inside verify token middleware");
  const token = req?.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  // verify the token
  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorized Access" });
    } else {
      // console.log("Okay");
      req.user = decoded;
    }
    next();
  });
};

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
    const appliedForVolunteerCollection = db.collection("appliedForVolunteer");
    console.log("Successfully connected to MongoDB!");

    // auth related APIS

    // ___________step 4___for jwt and cookies storage

    app.post("/jwt", async (req, res) => {
      const email = req.body.email;
      const payload = { email }; // Create a payload object
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "5h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          // secure: process.env.NODE_ENV === "production",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          // secure: process.env.NODE_ENV === "production",
        })
        .send({ success: true });
    });

    // ________________________________my posted job api
    app.post("/post-for-volunteer", async (req, res) => {
      try {
        const data = req.body;
    
        // Ensure volunteersNeeded is an integer
        if (data.volunteersNeeded) {
          data.volunteersNeeded = parseInt(data.volunteersNeeded, 10);
        }
    
        // Insert the document into the collection
        const result = await postVolunteerCollection.insertOne(data);
    
        if (result.acknowledged) {
          res.status(200).json({
            success: true,
            message: "Post added successfully",
            insertedId: result.insertedId,
          });
        } else {
          res.status(400).json({ message: "Failed to add post" });
        }
      } catch (err) {
        console.error("Error inserting result:", err);
        res.status(500).json({ message: "Failed to add post", error: err.message });
      }
    });
    

    app.get("/all-post-volunteer", async (req, res) => {
      try {
        const result = await postVolunteerCollection.find({}).toArray();
        res.status(200).json(result);
      } catch (err) {
        console.error("Error inserting result:", err);
        res
          .status(500)
          .json({ message: "Failed to find result", error: err.message });
      }
    });

    app.get("/volunteer-post/:id", async (req, res) => {
      const { id } = req.params; // Extract the ID from the route parameters

      try {
        const result = await postVolunteerCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json(result);
      } catch (err) {
        console.error("Error fetching volunteer post:", err);
        res
          .status(500)
          .json({ message: "Failed to fetch post", error: err.message });
      }
    });

    // front end volunteerPostDetails

 


// app.delete("/apply-for-volunteer", async (req, res) => {
//    const result = await appliedForVolunteerCollection.deleteMany({});
//     res.status(200).json(result);
// })




    app.post("/apply-for-volunteer", async (req, res) => {
      try {

        const data = req.body;
        const id = data?.data?.postId;
    
        console.log("Received data:", data); 
        console.log("Post ID to update:", id); 
    
       
        const result = await appliedForVolunteerCollection.insertOne(data.data);
        console.log("Insert result:", result);
    
        // Update the volunteersNeeded count
        const result2 = await postVolunteerCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $inc: { volunteersNeeded: -1 } },
          { returnDocument: "after" }
        );
        console.log("Update result:", result2); // Log the result of the update
    
        // if (!result2.value) {
        //   return res.status(404).json({ message: "Post not found" });
        // }
    
        if (result.acknowledged) {
          res.status(200).json({
            success: true,
            message: "Result added successfully",
          });
        }
      } catch (err) {
        console.error("Error inserting result:", err);
        res.status(500).json({
          message: "Failed to add result",
          error: err.message,
        });
      }
    });
    






    // app.patch("/decrease-volunteer-need/:id", async (req, res) => {
    //   const { id } = req.params;

    //   console.log("Received request to decrease volunteers for post ID:", id);

    //   try {

    //     const result = await postVolunteerCollection.findOneAndUpdate(
    //       { _id: new ObjectId(id) },
    //       { $inc: { volunteersNeeded: -1 } },
    //       { returnDocument: "after" }
    //     );

    //     if (!result.value) {
    //       return res.status(404).json({ message: "Post not found" });
    //     }

    //     console.log("Updated document:", result.value);

    //     res.status(200).json({
    //       message: "Volunteers needed count decreased successfully",
    //       updatedPost: result.value,
    //     });
    //   } catch (err) {
    //     console.error("Error in backend route:", err.message);
    //     res.status(500).json({ message: "Failed to decrease volunteers needed", error: err.message });
    //   }
    // });

    app.get("/applied-job/:email", verifyToken, async (req, res) => {
      const email = req?.params?.email;
      // console.log(email);

      const query = { applicantEmail: email };
      // console.log("Cookies : ", req.cookies);

      // ___________step 6___for jwt and cookies storage

      if (req?.user?.email !== email) {
        return res
          .status(403)
          .json({ success: false, message: "forbidden access" });
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
