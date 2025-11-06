const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

// Load env variables
dotenv.config();

// Models (adjust these paths to your actual files)
const Income = require("../models/income.model.js");
const Expense = require("../models/expense.model.js");

const router = express.Router();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ---------------------------------------------------------------------
   🧩 RATE LIMITER — Prevents too many AI requests (cost control)
   ------------------------------------------------------------------- */
const askLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // allow 3 AI questions per minute per IP
    message: { error: "Rate limit exceeded. Please wait before asking again." },
});

/* ---------------------------------------------------------------------
   🧩 Helper Functions — Pull user finance data from DB
   ------------------------------------------------------------------- */
async function get_balance(userId) {
    const incomes = await Income.find({ userId });
    const expenses = await Expense.find({ userId });

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, balance, currency: "INR" };
}

async function get_recent_transactions(userId, limit = 5) {
    const incomes = (await Income.find({ userId })).map((i) => ({
        date: i.date,
        type: "income",
        category: i.category || "Income",
        amount: i.amount,
    }));

    const expenses = (await Expense.find({ userId })).map((e) => ({
        date: e.date,
        type: "expense",
        category: e.category || "Expense",
        amount: e.amount,
    }));

    const all = [...incomes, ...expenses].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    return all.slice(0, limit);
}

/* ---------------------------------------------------------------------
   🧩 Main Ask AI Route — Uses Gemini API with context from user data
   ------------------------------------------------------------------- */
router.post("/ask", askLimiter, async (req, res) => {
    try {
        const { message, userId } = req.body;
        if (!message)
            return res.status(400).json({ error: "Message is required." });
        if (!userId)
            return res.status(400).json({ error: "User ID is required." });

        // Fetch live data
        const balanceData = await get_balance(userId);
        const recentTx = await get_recent_transactions(userId, 5);

        // Build context prompt
        const context = `
      You are WealthWiser, a personal finance AI assistant.
      The user's financial summary:
      - Total Income: ₹${balanceData.totalIncome}
      - Total Expense: ₹${balanceData.totalExpense}
      - Current Balance: ₹${balanceData.balance}

      Recent Transactions:
      ${recentTx
                .map(
                    (t) =>
                        `• ${t.date.toISOString().split("T")[0]} - ${t.type.toUpperCase()} (${t.category}): ₹${t.amount}`
                )
                .join("\n")}

      Rules:
      - Answer only finance-related questions.
      - Keep responses under 120 words.
      -Include probability in answer like, "yes you should","no you shouldnt", or "probably"
      - Use INR.
      - If the question is unrelated (e.g., coding, personal, random), reply: "I'm your finance assistant — I can only answer about your finances."
      - Do NOT give investment or crypto advice.
    `;

        // Use Gemini (MakerSuite free API)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(`${context}\n\nUser: ${message}`);
        const reply = result.response.text();

        res.json({ reply });
    } catch (error) {
        console.error("🔥 Gemini AI Error:", error);
        res
            .status(error.status || 500)
            .json({ error: error.message || "AI request failed" });
    }
});

module.exports = router;
