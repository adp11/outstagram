#!/usr/bin/env node

// Import dependencies
const debug = require("debug")("server:server");
const http = require("http");
const { Server } = require("socket.io");
const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
require("./passport");
const dotenv = require("dotenv");

const jwt = require("jsonwebtoken");

const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

// Set up mongoose connection
dotenv.config();
const mongoDB = "mongodb+srv://adp11:locpp2001@cluster0.yv9iv.mongodb.net/outstagram2?retryWrites=true&w=majority";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Import models
const User = require("./models/user");
const Post = require("./models/post");
// app.use(cors({ origin: ["http://localhost:3000", "https://google.com"], credentials: true }));

// Import controllers
const {
  signupUser, loginUser, getUserProfile, updateUserProfile, handleFollowToggle, getUserNotifications, updateUserNotifications, getHomeData,
} = require("./controllers/userController");
const {
  addPost, handleLikePost, addComment, getPostInfo, deletePost,
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

// GOOGLE
app.get("/login/google", passport.authenticate("google", { scope: ["email", "profile"], session: false }));

app.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login/failed", session: false }),
  (req, res) => {
    console.log("profile data passed from google strategy", req.data);
    jwt.sign({ id: req.data._id }, process.env.JWT_SECRET, (err4, token) => {
      res.cookie("jwtToken", token, { httpOnly: true });
      console.log("token (from google) is ", token);
      // res.redirect("/success");
      res.redirect("http://localhost:3000");
    });
  },
);

app.get("/login/failed", (req, res) => {
  res.send("Failed oauth");
});

app.get("/success", (req, res) => {
  res.send("Hello user");
});

// Controllers
app.get("/", extractToken, getHomeData);
app.post("/signup", signupUser);
app.post("/login", loginUser);
app.get("/users/:_id", getUserProfile);
app.put("/users/:_id", updateUserProfile);
app.put("/follow", handleFollowToggle);
app.get("/users/:_id/notifications", getUserNotifications);
app.put("/users/:_id/notifications", updateUserNotifications);

app.post("/post", addPost);
app.put("/like", handleLikePost);
app.put("/comment", addComment);
app.get("/posts/:_id", getPostInfo);
app.delete("/posts/:_id", deletePost);

app.post("/rooms", createRoom);
app.get("/rooms/:_id", getRoom);
app.delete("/rooms/:_id", deleteRoom);
app.post("/rooms/:_id", addMessage);

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
  });

  console.log("token extracted", jwtToken);
  if (jwtToken) {
    req.jwtToken = jwtToken;
    next();
  } else { res.sendStatus(403); }
}

// Catch 404 and handle error below
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("<h1>ERROR 404</h1>");
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

// // Realtime listening to User collection
// const userChangeStream = User.watch().on("change", (data) => {
//   // change in existing user
//   if (data.operationType === "update") {
//     User.findById(data.documentKey._id)
//       .populate("followers following rooms.members.other", "username displayName photoURL")
//       .select("-notifications")
//       .lean()
//       .exec((err3, populatedData) => {
//         if (err3) console.log("cannot retrieve existing user upon user data change");
//         else io.emit("userDataChange", { user: populatedData });
//       });
//   } else if (data.operationType === "insert") { // change because there's new user
//     User.findById(data.documentKey._id)
//       .select("username displayName photoURL")
//       .lean()
//       .exec((err3, data) => {
//         if (err3) console.log("cannot retrieve new user upon user data change");
//         else io.emit("userDataChange", { addedUser: data });
//       });
//   }
// });

// // realtime listening to Post collection
// const postChangeStream = Post.watch().on("change", (data) => {
//   if (data.operationType === "delete") {
//     io.emit("newsfeedChange", { removedPostId: data.documentKey._id });
//   } else {
//     Post.findById(data.documentKey._id)
//       .populate("author likes comments.commenter", "username displayName photoURL")
//       .lean()
//       .exec((err2, populatedData) => {
//         if (err2) console.log("cannot retrieve post upon post data change");
//         else io.emit("newsfeedChange", populatedData);
//       });
//   }
// });

// // stop realtime listening under 3 conditions
// // listen for TERM signal .e.g. kill
// process.on("SIGTERM", async () => {
//   console.log("closing realtime mongo");
//   await userChangeStream.close();
//   await postChangeStream.close();
// });

// // listen for INT signal e.g. Ctrl-C
// process.on("SIGINT", async () => {
//   console.log("closing realtime mongo");
//   await userChangeStream.close();
//   await postChangeStream.close();
// });

// // or even exit event
// process.on("exit", async () => {
//   console.log("closing realtime mongo");
//   await userChangeStream.close();
//   await postChangeStream.close();
// });

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
