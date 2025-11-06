const Income = require("../models/income.model.js");
const Expense = require("../models/expense.model.js");
const { isValidObjectId, Types } = require("mongoose");

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const userObjectId = new Types.ObjectId(req.user.id);

        //fetch total income and expense
        const totalIncome = await Income.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        console.log("Total Income Aggregate:", { totalIncome, userId: isValidObjectId(userId) });

        const totalExpense = await Expense.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        console.log("Total Expense Aggregate:", { totalExpense, userId: isValidObjectId(userId) });

        //get income transaction for last 60 days
        const last60DaysIncomeTransactions = await Income.find({
            userId: userObjectId,
            date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        }).sort({ date: -1 });
        //get total income for last 60 days
        const incomeLast60Days = last60DaysIncomeTransactions.reduce(
            (sum, transaction) => sum + transaction.amount, 0);

        //get expense transaction for last 30 days
        const last30DaysExpenseTransactions = await Expense.find({
            userId: userObjectId,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }).sort({ date: -1 });
        //get total expense for last 30 days
        const expenseLast30Days = last30DaysExpenseTransactions.reduce(
            (sum, transaction) => sum + transaction.amount, 0);

        //get last 5 transactions from income and expense
        // Get last 5 income and expense transactions
        const incomeTxns = await Income.find({ userId: userObjectId })
            .sort({ date: -1 })
            .limit(5);

        const expenseTxns = await Expense.find({ userId: userObjectId })
            .sort({ date: -1 })
            .limit(5);

        // Combine and tag them
        const lastTransactions = [
            ...incomeTxns.map(txn => ({ ...txn.toObject(), type: "income" })),
            ...expenseTxns.map(txn => ({ ...txn.toObject(), type: "expense" }))
        ].sort((a, b) => b.date - a.date);


        //final response
        res.status(200).json({
            totalBalance:
                (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
            totalIncome: totalIncome[0]?.total || 0,
            totalExpense: totalExpense[0]?.total || 0,
            last30DaysExpense: {
                total: expenseLast30Days,
                transactions: last30DaysExpenseTransactions
            },
            last60DaysIncome: {
                total: incomeLast60Days,
                transactions: last60DaysIncomeTransactions
            },
            recentTransactions: lastTransactions
        });

    } catch (err) {
        console.error("Error in getDashboardData:", err);
        res.status(500).json({ message: "Server Error in transaction" });
    }
}