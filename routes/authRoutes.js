const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");


const router = express.Router();

// In-memory storage for refresh tokens (Use database in production)
let refreshTokens = [];

// 📌 Generate Access & Refresh Tokens
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" }); // Short-lived access token
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: "7d" }); // Long-lived refresh token
};

// 📌 User Login (Stores Refresh Token in HTTP-Only Cookie)
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     console.log("inlogin", email, password)
// debugger
//     // Find user
//     let user = await User.findOne({ email });
//     console.log("user ", user)
//     if (!user) return res.status(400).json({ message: "Invalid credentials" });

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     console.log("ismatch", isMatch)
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     // Generate Tokens
//     const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });  // Short-lived
//     const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });  // Long-lived

//     // Set Refresh Token in HTTP-Only Cookie
//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,  // Cannot be accessed by JavaScript
//       secure: process.env.NODE_ENV === "production",  // Only HTTPS in production
//       sameSite: "Strict",  // Prevents CSRF
//       maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 Days
//     });

//     res.json({
//       accessToken,
//       user: { id: user._id, name: user.name, email: user.email }
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔹 Login Attempt:", { email, password });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Debugging: Log stored hashed password
    console.log("🔹 Stored Hashed Password:", user.password);

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔹 Password Match Result:", isMatch);

    if (!isMatch) {
      console.log("❌ Incorrect password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT Tokens
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

    // Store Refresh Token in HTTP-Only Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("✅ Login Successful:", { userId: user._id });

    res.json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error("❌ Server Error in Login:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// 📌 Refresh Access Token (Using Refresh Token from Cookie)
router.post("/refresh", (req, res) => {
  try {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: "15m" });

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

// 📌 Logout (Clear Refresh Token)
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});


// 

// 📌 User Login (Now returns both Access & Refresh Tokens)
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user
//     let user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "Invalid credentials" });

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     // Generate Tokens
//     const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });  // Short-lived
//     const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });  // Long-lived

//     // Store Refresh Token (for now, in-memory)
//     refreshTokens.push(refreshToken);

//     res.json({
//       accessToken,
//       refreshToken,
//       user: { id: user._id, name: user.name, email: user.email }
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // 📌 User Login
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user by email
//     let user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "Invalid credentials" });

//     // Compare passwords
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     // Generate JWT Token
//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

//     res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// 📌 User Registration (Signup)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



// 📌 Get Logged-in User's Profile (Protected)
router.get("/profile", authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user).select("-password"); // Exclude password
      if (!user) return res.status(404).json({ message: "User not found" });
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  

module.exports = router;
