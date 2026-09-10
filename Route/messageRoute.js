import express from "express";
import { createMessage, getAllMessages } from "../Controller/messageController.js";

const messageRouter = express.Router();

messageRouter.post("/", createMessage);       // Public form submission
messageRouter.get("/", getAllMessages);        // Admin fetch route (jwt middleware populates req.user)

export default messageRouter;