const async = require("async");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Post = require("../models/post");

exports.signupUser = (req, res, next) => {
  const { username, password, fullname } = req.body;
  const io = req.app.get("socketio");

  User.findOne({ username })
    .lean()
    .exec((err, user) => {
      if (err) return next(err);
      if (user) return res.json({ errorMsg: "The username is already in use by another account." });

      bcrypt.hash(password, 10, (err1, hashedPassword) => {
        if (err1) return res.json({ errorMsg: "Error when hashing your password. Please try again." });
        const user = new User({
          username,
          password: hashedPassword,
          displayName: fullname,
          followers: [],
          following: [],
          rooms: [],
        });

        user.save((err2) => {
          if (err2) return res.json({ errorMsg: "Error when creating your account. Please try again." });

          io.on("connection", (socket) => {
            console.log("new connection between 1 client and 1 socketId", socket.id);
            socket.on("disconnect", () => {
              console.log("close connection", socket.id);
            });
          });

          // query all users and send back with token and self-user
          User.find().select("username displayName photoURL").lean().exec((err3, users) => {
            jwt.sign(user, "secretkey", (err4, token) => {
              res.cookie("jwtToken", token, { httpOnly: true });
              res.json({ user, users, newsfeed: [] });
            });
          });
        });
      });
    });
};

exports.loginUser = (req, res, next) => {
  const io = req.app.get("socketio");
  const { username, password } = req.body;

  User.findOne({ username })
    .populate("followers following", "username displayName photoURL")
    .lean()
    .exec((err, user) => {
      if (err) return next(err);
      if (!user) return res.json({ errorMsg: "The username you entered doesn't belong to an account. Please check your username and try again." });

      bcrypt.compare(password, user.password, (err1, response) => {
        if (!response) return res.json({ errorMsg: "Sorry, your password was incorrect. Please double-check your password." });

        io.on("connection", (socket) => {
          console.log("new connection between 1 client and 1 socketId", socket.id);
          socket.on("disconnect", () => {
            console.log("close connection", socket.id);
          });
        });

        // query all users, newsfeed, and send back with token and self-user
        async.parallel({
          users: (callback) => {
            User.find().select("username displayName photoURL").lean().exec(callback);
          },
          newsfeed: (callback) => {
            Post
              .find({ author: { $in: user.following.concat(user._id) } })
              .populate("author likes comments.commenter", "username displayName photoURL")
              // .populate("comments.commenter", "username displayName photoURL")
              .lean()
              .sort("-createdAt")
              .exec(callback);
          },
        }, (err3, results) => {
          if (err3) {
            console.log("error in querying newsfeed");
          } else {
            jwt.sign(user, "secretkey", (err4, token) => {
              res.cookie("token", token, { httpOnly: true });
              res.json({ user, users: results.users, newsfeed: results.newsfeed });
            });
          }
        });
      });
    });
};
