require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoute");
const expenseRoutes = require("./routes/expenseRoute");
const dashboardRoutes = require("./routes/dashboardRoute");
const newsRoute = require("./routes/newsRoutes");
const askRoute = require("./routes/ask")

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to database
connectDB();

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1", newsRoute);
app.use("/api/v1", askRoute)


app.get("/api/v1/debug-env", (req, res) => {
  res.json({
    mongoURI: !!process.env.MONGO_URI,
    jwtSecret: !!process.env.JWT_SECRET,
    geminiKey: !!process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV
  });
});


//const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

//serverless function
module.exports=app