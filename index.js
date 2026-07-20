import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import cors from "cors";
import jwt from "jsonwebtoken";
import userRouter from "./Route/userRoute.js";
import orderRouter from "./Route/orderRoute.js";
import productRouter from "./Route/productRoute.js";

dotenv.config();

const app = express();

// Middleware

app.use(cors());

app.use(bodyParser.json());
app.use(express.json());

app.use((req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return next(); // no token, skip

  const token = authHeader.replace("Bearer ", "");
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY); // returns payload directly
    req.user = decoded; // attach user info to request
    next(); // proceed
  } catch (err) {
    console.error("Invalid token:", err);
    return res.status(403).json({ message: "Invalid Token" }); 
  }
});


app.use("/api/users", userRouter );  
app.use("/orders", orderRouter );
app.use("/api/products", productRouter );







// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Start the server only after the database is connected
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err);
  });