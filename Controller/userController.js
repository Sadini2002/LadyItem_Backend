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
/*export async function getMyProfile(req, res) {
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
}*/