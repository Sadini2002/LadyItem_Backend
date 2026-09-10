import User from '../model/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';

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
        firstname: googleUser.given_name || googleUser.name || "Google",
        lastname: googleUser.family_name || "User",
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

//manage send email

const transport = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
})

// Send OTP Function (Supports Login & Signup)
export async function sendOTP(req, res) {
  try {
    const { email, firstname, lastname, password, role, isSignup } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const randomOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    let foundUser = await User.findOne({ email });

    if (isSignup || (firstname && lastname)) {
      // Signup Mode
      if (foundUser && foundUser.password && !foundUser.otp) {
        return res.status(400).json({ message: "Email is already registered. Please login instead." });
      }

      const hashedPassword = password ? bcrypt.hashSync(password, 10) : "";

      if (!foundUser) {
        foundUser = new User({
          email,
          firstname: firstname || "User",
          lastname: lastname || "",
          password: hashedPassword,
          role: role || "user",
          otp: randomOTP,
          otpExpiresAt
        });
      } else {
        foundUser.firstname = firstname || foundUser.firstname;
        foundUser.lastname = lastname || foundUser.lastname;
        if (hashedPassword) foundUser.password = hashedPassword;
        if (role) foundUser.role = role;
        foundUser.otp = randomOTP;
        foundUser.otpExpiresAt = otpExpiresAt;
      }
    } else {
      // Login Mode
      if (!foundUser) {
        return res.status(404).json({ message: "No account found with this email. Please sign up first." });
      }
      foundUser.otp = randomOTP;
      foundUser.otpExpiresAt = otpExpiresAt;
    }

    await foundUser.save();

    const mailOptions = {
      from: `"LadyItem" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code (OTP)",
      text: `Your OTP for verification is: ${randomOTP}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2>LadyItem Verification Code</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #8B1A24; letter-spacing: 4px;">${randomOTP}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    };

    // Send email using async/await
    await transport.sendMail(mailOptions);

    return res.status(200).json({
      message: "OTP sent successfully to email"
    });

  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({
      message: "Failed to send OTP",
      error: error.message
    });
  }
}


// Verify OTP Function
export async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if OTP matches
    if (foundUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }
    // Check if OTP is expired
    if (new Date() > new Date(foundUser.otpExpiresAt)) {
      return res.status(400).json({ message: "OTP code has expired. Please request a new one." });
    }
    // Clear OTP fields after successful verification
    foundUser.otp = null;
    foundUser.otpExpiresAt = null;
    await foundUser.save();
    // Generate JWT token
    const token = jwt.sign(
      {
        id: foundUser._id,
        email: foundUser.email,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        role: foundUser.role,
        img: foundUser.img
      },
      process.env.JWT_KEY,
      { expiresIn: "7d" }
    );
    return res.status(200).json({
      message: "OTP verified successfully. Login successful!",
      token: token,
      role: foundUser.role
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      message: "Server error while verifying OTP",
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

// Reset Password Function (with OTP Verification)
export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Check OTP
    if (foundUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    // Check expiration
    if (new Date() > new Date(foundUser.otpExpiresAt)) {
      return res.status(400).json({ message: "OTP code has expired. Please request a new code." });
    }

    // Hash new password & clear OTP fields
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    foundUser.password = hashedPassword;
    foundUser.otp = null;
    foundUser.otpExpiresAt = null;
    await foundUser.save();

    return res.status(200).json({
      message: "Password reset successful! You can now log in with your new password."
    });

  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      message: "Server error while resetting password",
      error: error.message
    });
  }
}