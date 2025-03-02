const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Remove 'Bearer ' from the token string
    const tokenWithoutBearer = token.replace("Bearer ", "").trim();

    // Decode the token
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);

    // Attach userId to req.user
    req.user = decoded.userId; 

    console.log("Authenticated User ID:", req.user); // Debugging log

    next(); // Move to the next middleware

  } catch (error) {
    console.log("error in middleware", error )
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
