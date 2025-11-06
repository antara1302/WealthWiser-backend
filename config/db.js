const mongoose = require('mongoose');

let isConnected = false;
const connectDB = async () => {
    if (isConnected) {
    //Use existing connection
    return;
  }

    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        isConnected=true;
        console.log('MongoDB connected successfully');
    }
    catch (err) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

module.exports = connectDB;