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
      "https://humanity-by-mostafiz.netlify.app",
  
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

    // await client.connect();
    // await client.db("admin").command({ ping: 1 });

    // Access the database and collections

    const db = client.db("humanity");
    const postVolunteerCollection = db.collection("postVolunteer");
    const appliedForVolunteerCollection = db.collection("appliedForVolunteer");
    const workExperienceCollection = db.collection("workExperience");
    const savedPostCollection = db.collection("savedPost");

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
    app.post("/post-for-volunteer", verifyToken, async (req, res) => {
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
    

    // public
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





//private

    app.get("/volunteer-post/:id", verifyToken, async (req, res) => {
      const { id } = req.params; 

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


//private

    app.post("/apply-for-volunteer",verifyToken, async (req, res) => {
      try {

        const data = req.body;
        const id = data?.data?.postId;
    
        console.log("Received data:", data); 
        console.log("Post ID to update:", id); 
    
       
        const result = await appliedForVolunteerCollection.insertOne(data.data);
        console.log("Insert result:", result);
    
        // Update the volunteersNeeded count
        // const result2 = await postVolunteerCollection.findOneAndUpdate(
        //   { _id: new ObjectId(id) },
        //   { $inc: { volunteersNeeded: -1 } },
        //   { returnDocument: "after" }
        // );
        // console.log("Update result:", result2); // Log the result of the update
    
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
    


// ________________my volunteer post 
//private
app.get("/volunteer-posts/:email",verifyToken, async (req, res) => {
  const { email } = req.params;

  if (req?.user?.email !== email) {
    return res
      .status(403)
      .json({ success: false, message: "forbidden access" });
  }

  try {
    const result = await postVolunteerCollection.find({ organizerEmail: email }).toArray();
   
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
});



app.get("/volunteer-post/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await postVolunteerCollection.findOne({ _id: new ObjectId(id) });
  
    res.status(200).json(result);

  } catch (err) {
    console.error("Error fetching volunteer post:", err);
    res.status(500).json({ message: "Failed to fetch post", error: err.message });
  }
});






//private route
app.put("/update-volunteer-post/:id",verifyToken, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  console.log("Received request to update post ID:", id);
  console.log("Received update data:", updateData);

  try {
 
     const { _id, ...updateFields } = updateData;

    const result = await postVolunteerCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json(result);
    
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update post",
      error: err.message,
    });
  }
});




//private
app.delete("/delete-volunteer-post/:id",verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await postVolunteerCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Failed to delete post", error: err.message });
  }
});


// ___________my volunteer post end


//private
// my volunteer request page

app.get("/volunteer-requests/:email", verifyToken, async (req, res) => {
  const { email } = req?.params;

  

  // ___________step 6___for jwt and cookies storage

  if (req?.user?.email !== email) {
    return res
      .status(403)
      .json({ success: false, message: "forbidden access" });
  }

try {
    const requests = await appliedForVolunteerCollection.find({ volunteerEmail: email }).toArray();
    res.status(200).json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});



// my volunteer request page

app.post("/cancel-volunteer-request", verifyToken, async (req, res) => {
    const data = req.body;
    const postId = data?.postId;
    const id = data?._id;
    const status = data?.status;

    // console.log(postId);
    // console.log(id);

  try {

   if(status === "accepted") {
     const result2 = await postVolunteerCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $inc: { volunteersNeeded: 1 } },
      { returnDocument: "after" }
    );
   }

    // console.log("Update result2:", result2); 
    const result = await appliedForVolunteerCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json(result);

  } catch (err) {
    console.error("Error canceling request:", err);
    res.status(500).json({ message: "Failed to cancel request" });
  }
});


//public
// home -> volunteer need now
app.get("/volunteer-posts-sorted", async (req, res) => {
  try {
    const posts = await postVolunteerCollection
      .find({})
      .sort({ deadline: 1 }) // Sort by deadline in ascending order
      .limit(6) // Limit to 6 posts
      .toArray();

    res.status(200).json(posts);
  } catch (err) {
    console.error("Error fetching sorted posts:", err.message);
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
});



//public route
// share work experience
app.post('/work-experience', async (req, res) => {
  const workExperienceData = req.body;
  console.log(workExperienceData)

  try {
      const result = await workExperienceCollection.insertOne(workExperienceData);

      if (result.acknowledged) {
          res.status(201).json(result);
      } else {
          res.status(500).json({
              success: false,
              message: "Failed to add work experience.",
          });
      }
  } catch (error) {
      console.error("Error adding work experience:", error);
      res.status(500).json({
          success: false,
          message: "Internal server error.",
          error: error.message,
      });
  }
});


//public route
// get work experience
app.get('/work-experience', async (req, res) => {
  try {
      // Fetch all work experiences sorted by creation date
      const workExperiences = await workExperienceCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

      res.status(200).json(workExperiences);
  } catch (error) {
      console.error("Error fetching work experiences:", error);
      res.status(500).json({
          success: false,
          message: "Internal server error.",
          error: error.message,
      });
  }
});

// _________received request page

//private route
app.get("/organizer-posts/:email", verifyToken, async (req, res) => {
  const { email } = req.params; // Extract organizer's email
  try {
    const posts = await postVolunteerCollection.find({ organizerEmail: email }).toArray();
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
});


//private route
app.post("/applied-requests", verifyToken, async (req, res) => {
  const { postIds } = req.body; // An array of post IDs
  try {
    const requests = await appliedForVolunteerCollection.find({ postId: { $in: postIds } }).toArray();
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applied requests", error: err.message });
  }
});


// private route
app.post("/update-request-status", verifyToken, async (req, res) => {
 

  const data = req.body;
  // console.log(data);
  const id = data?.id;
  const status = data?.status;
  const postId = data?.postId;

  try {

    if(status === "accepted") {
      console.log(status);
      const result2 = await postVolunteerCollection.findOneAndUpdate(
        { _id: new ObjectId(postId) },
        { $inc: { volunteersNeeded: -1 } },
        { returnDocument: "after" }
      );
      // console.log("Update result:", result2);
    }


    const result = await appliedForVolunteerCollection.updateOne(
      { _id: new ObjectId(id) }, // Match the request by its ID
      { $set: { status } } // Update the status field
    );




    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to update request status", error: err.message });
  }
});





// post detail page
//private route
//operation start

app.post("/save-post", verifyToken, async (req, res) => {
  try {
    const saveData = req.body;

    // Validate required fields
    if (!saveData.postId || !saveData.email) {
      return res.status(400).json({ message: "Post ID and email are required." });
    }

    // Check if the post is already saved by the user
    const existingPost = await savedPostCollection.findOne({
      postId: saveData.postId,
      email: saveData.email,
    });

    if (existingPost) {
      return res.status(409).json({ message: "Post already saved." });
    }

    // Insert the save data into the collection
    const result = await savedPostCollection.insertOne(saveData);

    if (result.acknowledged) {
      res.status(200).json({
        success: true,
        message: "Post saved successfully.",
        insertedId: result.insertedId,
      });
    } else {
      res.status(400).json({ message: "Failed to save post." });
    }
  } catch (err) {
    console.error("Error saving post:", err);
    res.status(500).json({ message: "Failed to save post.", error: err.message });
  }
});


app.get("/check-saved/:postId/:email", verifyToken, async (req, res) => {
  try {
    const { postId, email } = req.params;

    // Validate parameters
    if (!postId || !email) {
      return res.status(400).json({ message: "Post ID and email are required." });
    }

    // Find the saved post in the collection
    const savedPost = await savedPostCollection.findOne({ postId, email });

    if (savedPost) {
      res.status(200).json({ success: true, saved: true, data: savedPost });
    } else {
      res.status(200).json({ success: true, saved: false });
    }
  } catch (err) {
    console.error("Error checking saved status:", err);
    res.status(500).json({ message: "Failed to check saved status.", error: err.message });
  }
});



//saved page route

app.get("/saved-posts/:email", verifyToken, async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const savedPosts = await savedPostCollection.find({ email }).toArray();
    res.status(200).json(savedPosts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch saved posts", error: error.message });
  }
});


app.delete("/saved-posts/:postId/:email", verifyToken, async (req, res) => {
  try {
    const { postId, email } = req.params;
    console.log(postId, email)

    if (!postId || !email) {
      return res.status(400).json({ message: "Post ID and email are required" });
    }

    const query = {_id : new ObjectId(postId), email}
    const result = await savedPostCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Saved post not found" });
    }

    res.status(200).json({ success: true, message: "Saved post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete saved post", error: error.message });
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
