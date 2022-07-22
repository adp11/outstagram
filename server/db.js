const mongoose = require("mongoose");
require("dotenv").config();

// Set up DB connection
const mongoDB = process.env.DB_KEY;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
