#!/usr/bin/env node

// Import dependencies
const debug = require("debug")("server:server");
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");

const passport = require("passport");
const compression = require("compression");
require("./passport");

const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const HttpError = require("./models/HttpError");

// Import models
const User = require("./models/user");
const Post = require("./models/post");
require("dotenv").config();
require("./db");

// Import controllers
const {
  getHomeData, signupUser, loginUser, loginWithGoogle, getUserProfile, updateUserProfile, updateUserFollows, getUserNotifications, updateUserNotifications,
} = require("./controllers/userController");
const {
  addPost, updatePostLikes, updatePostComments, getPost, deletePost,
} = require("./controllers/postController");
const {
  createRoom, getRoom, deleteRoom, addMessage,
} = require("./controllers/roomController");

// Middleware functions
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(passport.initialize());

// User controllers
app.get("/login/google", passport.authenticate("google", { scope: ["email", "profile"], session: false }));
app.get("/google/callback", passport.authenticate("google", { failureRedirect: "/googleLoginFailure", session: false }), loginWithGoogle);
app.get("/googleLoginFailure", (req, res) => res.status(500).send("<h1>Google Login Failure</h1>"));

app.get("/api/homeData", extractToken, getHomeData);
app.post("/api/signup", signupUser);
app.post("/api/login", loginUser);
app.get("/api/users/:_id", getUserProfile);
app.put("/api/users/:_id", updateUserProfile);
app.put("/api/users/:_id/follows", updateUserFollows);
app.get("/api/users/:_id/notifications", getUserNotifications);
app.put("/api/users/:_id/notifications", updateUserNotifications);

// Post controllers
app.post("/api/posts", addPost);
app.get("/api/posts/:_id", getPost);
app.delete("/api/posts/:_id", deletePost);
app.put("/api/posts/:_id/likes", updatePostLikes);
app.put("/api/posts/:_id/comments", updatePostComments);

// Room controllers
app.post("/api/rooms", createRoom);
app.get("/api/rooms/:_id", getRoom);
app.post("/api/rooms/:_id", addMessage);
app.delete("/api/rooms/:_id", deleteRoom);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "client", "build")));
  app.get(["/", "/u/:_id", "/p/:_id"], (req, res) => {
    res.sendFile(path.resolve(__dirname, "..", "client", "build", "index.html"));
  });
}

// API error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  if (err instanceof HttpError) {
    return res.status(err.code).json({ message: err.message });
  }

  return res.status(503).json({ message: "Something went wrong" });
});

// Port and server setup
const port = normalizePort(process.env.PORT || "5000");
app.set("port", port);

const server = http.createServer(app); // Create HTTP server.

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

// Socket setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

app.set("socketio", io);

// Realtime listening to User collection (need to close when in dev mode)
const userChangeStream = User.watch().on("change", (data) => {
  // change in existing user
  if (data.operationType === "update") {
    User.findById(data.documentKey._id)
      .populate("followers following rooms.members.other", "username displayName photoURL")
      .select("-notifications")
      .lean()
      .exec((err, populatedData) => {
        if (err) console.log("cannot retrieve existing user upon user data change");
        else io.emit("userDataChange", { user: populatedData });
      });
  } else if (data.operationType === "insert") { // change because there's new user
    User.findById(data.documentKey._id)
      .select("username displayName photoURL")
      .lean()
      .exec((err) => {
        if (err) console.log("cannot retrieve new user upon user data change");
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
      .exec((err, populatedData) => {
        if (err) console.log("cannot retrieve post upon post data change");
        else io.emit("newsfeedChange", populatedData);
      });
  }
});

// Helper token function
function extractToken(req, res, next) {
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

  if (jwtToken) {
    req.jwtToken = jwtToken;
    next();
  } else { res.sendStatus(403); }
}

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
