const express = require("express");
const Expense = require("../models/Expense");
const authMiddleware = require("../middleware/authMiddleware"); // Ensure this exists

const router = express.Router();

// ✅ Add a new expense
// router.post("/", authMiddleware, async (req, res) => {
//   try {
//     const { description, category, amount } = req.body;
//     const userId = req.user.id; // Extract user ID from token

//     const newExpense = new Expense({ userId, description, category, amount });
//     await newExpense.save();

//     res.status(201).json({ success: true, message: "Expense added successfully", expense: newExpense });
//   } catch (error) {
//     console.error("Error adding expense:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// router.post("/", authMiddleware, async (req, res) => {
//   try {
//     console.log("Request Body:", req.body);
//     console.log("User ID from Middleware:", req.user); // Debugging log

//     const { amount, category, date } = req.body;

//     if (!amount || !category || !date) {
//       return res.status(400).json({ success: false, message: "Missing fields" });
//     }

//     const newExpense = new Expense({
//       userId: req.user, // Attach userId from middleware
//       amount,
//       category,
//       date,
//     });

//     await newExpense.save();
//     res.json({ success: true, message: "Expense added successfully" });

//   } catch (error) {
//     console.error("Error adding expense:", error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// });
router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("User ID from Middleware:", req.user); // Debugging log

    const { description, amount, category, date } = req.body;

    if (!description || !amount || !category || !date) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const newExpense = new Expense({
      userId: req.user, // Attach userId from middleware
      description,  // Add description here
      amount,
      category,
      date,
    });

    await newExpense.save();
    res.json({ success: true, message: "Expense added successfully" });

  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


// ✅ Get all expenses for the logged-in user
// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const expenses = await Expense.find({ userId }).sort({ date: -1 });

//     res.json({ success: true, expenses });
//   } catch (error) {
//     console.error("Error fetching expenses:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log("Request received for fetching expenses.");
    console.log("User from middleware:", req.user);

    // No need to check for req.user.id if req.user is the ID itself
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID" });
    }

    const userId = req.user; // Directly assign it
    console.log("Fetching expenses for userId:", userId);

    const expenses = await Expense.find({ userId }).sort({ date: -1 });

    console.log("Expenses fetched:", expenses);

    res.json({ success: true, expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});



// ✅ Delete an expense
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    if (expense.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await expense.deleteOne();
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
