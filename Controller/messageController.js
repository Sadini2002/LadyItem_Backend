
import Message from '../model/message.js';

// Public: Users send messages from the form
export async function createMessage(req, res) {
  try {
    const { name, email, message } = req.body;
    
    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    res.status(201).json({ message: "Message sent successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
}

// Admin Only: Fetch all submitted messages
export async function getAllMessages(req, res) {
  try {
    // Requires admin privileges
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can view messages" });
    }

    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
}
