const mongoose = require('mongoose');

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1); // Stop the server if DB connection fails
  }
};

mongoose.connection.once("open", () => {
  console.log("CONNECTED DB NAME:", mongoose.connection.name);
});

module.exports = connectDb;
