#!/usr/bin/env node

// Import dependencies
const debug = require("debug")("server:server");
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
require("./passport");
const jwt = require("jsonwebtoken");

const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const HttpError = require("./HttpError");

// Set up DB connection
const mongoDB = "mongodb+srv://adp11:locpp2001@cluster0.yv9iv.mongodb.net/outstagram2?retryWrites=true&w=majority";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Import models
const User = require("./models/user");
const Post = require("./models/post");

// Import controllers
const {
  getHomeData, signupUser, loginUser, loginWithGoogle, getUserProfile, updateUserProfile, handleUserFollow, getUserNotifications, updateUserNotifications,
} = require("./controllers/userController");
const {
  addPost, handlePostLike, addPostComment, getPostInfo, deletePost,
} = require("./controllers/postController");
const {
  createRoom, getRoom, deleteRoom, addMessage,
} = require("./controllers/roomController");

// Middleware functions
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());

// User controllers
app.get("/login/google", passport.authenticate("google", { scope: ["email", "profile"], session: false }));
app.get("/google/callback", passport.authenticate("google", { failureRedirect: "/googleLoginFailure", session: false }), loginWithGoogle);
app.get("/googleLoginFailure", (req, res) => {
  res.send("<h1>Google Login Failure</h1>");
});

app.get("/", extractToken, getHomeData);
app.post("/signup", signupUser);
app.post("/login", loginUser);
app.get("/users/:_id", getUserProfile);
app.put("/users/:_id", updateUserProfile);
app.put("/users/:_id/follows", handleUserFollow);
app.get("/users/:_id/notifications", getUserNotifications);
app.put("/users/:_id/notifications", updateUserNotifications);

// Post controllers
app.post("/posts", addPost);
app.get("/posts/:_id", getPostInfo);
app.delete("/posts/:_id", deletePost);
// app.put("/posts/:_id/likes", handlePostLike);
// app.put("/posts/:_id/comments", addPostComment);

// Room controllers
app.post("/rooms", createRoom);
app.get("/rooms/:_id", getRoom);
app.post("/rooms/:_id", addMessage);
app.delete("/rooms/:_id", deleteRoom);

// Helper token function
function extractToken(req, res, next) {
  console.log("req.headers", req.headers);
  let jwtToken;
  req.headers.cookie.split(" ").some((cookie) => {
    const equalPosition = cookie.indexOf("=");
    if (cookie.substring(0, equalPosition) === "jwtToken") {
      const semiColonPosition = cookie.indexOf(";");
      if (semiColonPosition > -1) {
        jwtToken = cookie.substring(equalPosition + 1, cookie.length - 1);
      } else {
        jwtToken = cookie.substring(equalPosition + 1);
      }
      return true;
    }
    return false;
  });

  // console.log("token extracted", jwtToken);
  if (jwtToken) {
    req.jwtToken = jwtToken;
    next();
  } else { res.sendStatus(403); }
}

// API error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  if (err instanceof HttpError) {
    return res.status(err.code).json({ errorMessage: err.message });
  }

  return res.status(503).json({ errorMessage: "Something went wrong" });
});

// Port and server setup
const port = normalizePort(process.env.PORT || "4000");
app.set("port", port);

const server = http.createServer(app); // Create HTTP server.

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

// Socket setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.set("socketio", io);

// Realtime listening to User collection
const userChangeStream = User.watch().on("change", (data) => {
  // change in existing user
  if (data.operationType === "update") {
    User.findById(data.documentKey._id)
      .populate("followers following rooms.members.other", "username displayName photoURL")
      .select("-notifications")
      .lean()
      .exec((err3, populatedData) => {
        if (err3) console.log("cannot retrieve existing user upon user data change");
        else io.emit("userDataChange", { user: populatedData });
      });
  } else if (data.operationType === "insert") { // change because there's new user
    User.findById(data.documentKey._id)
      .select("username displayName photoURL")
      .lean()
      .exec((err3, data) => {
        if (err3) console.log("cannot retrieve new user upon user data change");
        else io.emit("userDataChange", { addedUser: data });
      });
  }
});

// realtime listening to Post collection
const postChangeStream = Post.watch().on("change", (data) => {
  if (data.operationType === "delete") {
    io.emit("newsfeedChange", { removedPostId: data.documentKey._id });
  } else {
    Post.findById(data.documentKey._id)
      .populate("author likes comments.commenter", "username displayName photoURL")
      .lean()
      .exec((err2, populatedData) => {
        if (err2) console.log("cannot retrieve post upon post data change");
        else io.emit("newsfeedChange", populatedData);
      });
  }
});

// stop realtime listening under 3 conditions
// listen for TERM signal .e.g. kill
process.on("SIGTERM", async () => {
  console.log("closing realtime mongo");
  await userChangeStream.close();
  await postChangeStream.close();
});

// listen for INT signal e.g. Ctrl-C
process.on("SIGINT", async () => {
  console.log("closing realtime mongo");
  await userChangeStream.close();
  await postChangeStream.close();
});

// or even exit event
process.on("exit", async () => {
  console.log("closing realtime mongo");
  await userChangeStream.close();
  await postChangeStream.close();
});

// Normalize a port into a number, string, or false.
function normalizePort(val) {
  const PORT = parseInt(val, 10);

  if (Number.isNaN(PORT)) {
    // named pipe
    return val;
  }

  if (PORT >= 0) {
    // port number
    return PORT;
  }

  return false;
}

// Event listener for HTTP server "error" event.
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string"
    ? `Pipe ${port}`
    : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event.
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string"
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}

module.exports = app;
