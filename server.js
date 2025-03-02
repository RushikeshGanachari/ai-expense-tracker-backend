const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const expenseRoutes = require("./routes/expenseRoutes"); // Import expense routes


const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes"); // ✅ Import this

const app = express();
app.use(cors({ origin: "http://localhost:4200", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log("Received Token:", req.headers.authorization);
  next();
});



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));


  // API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // Add this line
app.use("/api/expenses", expenseRoutes);



app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
