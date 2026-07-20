import User from '../model/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Create User
export function createUser(req, res) {
  try {
    // Only admins can create another admin
    if (req.body.role === "admin") {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can create another admin user" });
      }
    }
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const newUser = new User({

      email: req.body.email,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      password: hashedPassword,
      role: req.body.role || "user", // default role
      isBlock: req.body.isBlock || false,
      img: req.body.img || null
    });

    newUser.save()
      .then(() => {
        res.json({ message: 'User created successfully' });
      })
      .catch((err) => {
        res.status(400).json({ message: 'Error creating user', error: err });
      });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Login User
export function loginUser(req, res) {
  const { email, password } = req.body;

  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          img: user.img
        },
        process.env.JWT_KEY
      );

      res.json({ 
        message: "Login successful", 
        token: token,
        role: user.role
      });
    })
    .catch(err => {
      console.error("Error logging in:", err);
      res.status(500).json({ message: "Error logging in", error: err.message });
    });
}

// Check Admin
export function isAdmin(req) {
  if (!req.user) {
    return false;
  }
  return req.user.role === 'admin';
}

// Get All Users
export function getAllUsers(req, res) {
  // Only admin can get all users
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Only admin can access all users" });
  }

  User.find({}, "-password") // exclude passwords
    .then(users => {
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }
      res.json(users);
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Server error while fetching users", error: err.message });
    });
}

export function deleteUser(req, res) {
  // Only admin can delete users
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Only admin can delete users" });
  }
  const userId = req.params.id;

  User.findByIdAndDelete(userId)
    .then(deletedUser => {
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    })
    .catch(err => {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Server error while deleting user", error: err.message });
    });
}
