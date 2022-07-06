#!/usr/bin/env node

const debug = require("debug")("server:server");
const http = require("http");
const { Server } = require("socket.io");
const createError = require("http-errors");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Set up mongoose connection
const mongoDB = "mongodb+srv://adp11:locpp2001@cluster0.yv9iv.mongodb.net/outstagram?retryWrites=true&w=majority";

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

// Import controllers
const {
  signupUser, loginUser, getUserProfile, handleFollowToggle, getUserNotifications, updateUserNotifications,
} = require("./controllers/userController");
const {
  addPost, handleLikePost, addComment, getPostInfo, deletePost,
} = require("./controllers/postController");

// Import models
const User = require("./models/user");
const Post = require("./models/post");

// set up standard middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.post("/signup", signupUser);
app.post("/login", loginUser);
app.get("/users/:_id", getUserProfile);
app.put("/follow", handleFollowToggle);
app.get("/users/:_id/notifications", getUserNotifications);
app.put("/users/:_id/notifications", updateUserNotifications);

app.post("/post", addPost);
app.put("/like", handleLikePost);
app.put("/comment", addComment);
app.get("/posts/:_id", getPostInfo);
app.delete("/posts/:_id", deletePost);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("<h1>ERROR 404</h1>");
});

// Get port from environment and store in Express.
const port = normalizePort(process.env.PORT || "4000");
app.set("port", port);

// Create HTTP server.
const server = http.createServer(app);

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

// Set socket
const io = new Server(server);
app.set("socketio", io);

// realtime listening to User collection
const userChangeStream = User.watch().on("change", (data) => {
  // change in existing user
  if (data.operationType === "update") {
    User.findById(data.documentKey._id)
      .populate("followers following", "username displayName photoURL")
      .select("-notifications -rooms")
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
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
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
