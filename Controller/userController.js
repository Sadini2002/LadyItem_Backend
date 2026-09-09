import User from '../model/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';


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
      // compare the provided password with the hashed password in the database
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
        process.env.JWT_KEY,
        { expiresIn: "7d" }
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


const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

export async function loginWithGoogle(req, res) {
  try {
    const credential = req.body.credential;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required"
      });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const googleUser = ticket.getPayload();

    console.log("Google user:", googleUser);

    const user = await User.findOne({
      email: googleUser.email
    });

    if (!user) {

      // Create new user
      const newUser = new User({
        email: googleUser.email,
        firstname: googleUser.given_name || "",
        lastname: googleUser.family_name || "",
        img: googleUser.picture || null,
        role: "user"
      });

      await newUser.save();

      const jwtToken = jwt.sign(
        {
          id: newUser._id,
          email: newUser.email,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          role: newUser.role,
          img: newUser.img
        },
        process.env.JWT_KEY,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        token: jwtToken,
        role: newUser.role
      });

    } else {

      // Existing user
      const jwtToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          img: user.img
        },
        process.env.JWT_KEY,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        token: jwtToken,
        role: user.role
      });
    }

  } catch (error) {
    console.error("Google login error:", error);

    return res.status(400).json({
      message: "Google login failed",
      error: error.message
    });
  }
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

// Get Single User by ID
export function getUserById(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Only admin can access user details" });
  }

  const userId = req.params.id;

  User.findById(userId, "-password")
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    })
    .catch(err => {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Server error while fetching user", error: err.message });
    });
}

// Update User
export function updateUser(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Only admin can update users" });
  }

  const userId = req.params.id;

  User.findById(userId)
    .then((targetUser) => {
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.role !== "admin") {
        return res
          .status(403)
          .json({ message: "User and customer accounts cannot be edited" });
      }

      const updateData = { ...req.body };

      if (updateData.password) {
        updateData.password = bcrypt.hashSync(updateData.password, 10);
      }

      User.findByIdAndUpdate(userId, updateData, {
        new: true,
        select: "-password",
      })
        .then((user) => {
          res.json({ message: "User updated successfully", user });
        })
        .catch((err) => {
          console.error("Error updating user:", err);
          res
            .status(500)
            .json({
              message: "Server error while updating user",
              error: err.message,
            });
        });
    })
    .catch((err) => {
      console.error("Error finding user:", err);
      res
        .status(500)
        .json({ message: "Server error", error: err.message });
    });
}

// Delete User
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

export async function getUserById(req, res) {
  try {
    const id = req.params.id;

    const foundUser = await User.findById(id).select("-password");

    if (!foundUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(foundUser);

  } catch (error) {
    console.error("Get user by ID error:", error);

    res.status(500).json({
      message: "Failed to get user",
      error: error.message,
    });
  }
}



export async function updateUser(req, res) {
  try {
    const id = req.params.id;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        role: req.body.role,
        isBlock: req.body.isBlock,
        img: req.body.img,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
}
export async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User profile fetched successfully",
      user: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Failed to get user profile",
      error: error.message,
    });
  }
}