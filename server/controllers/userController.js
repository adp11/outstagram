const async = require("async");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Post = require("../models/post");

exports.signupUser = (req, res, next) => {
  const { username, password, fullname } = req.body;
  const io = req.app.get("socketio");

  User.findOne({ username }, (err, user) => {
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
        posts: [],
        notifications: [],
        rooms: [],
      });

      user.save((err2) => {
        if (err2) return res.json({ errorMsg: "Error when creating your account. Please try again." });

        // // realtime listening to User collection
        // const userChangeStream = User.watch().on("change", (data) => {
        //   console.log("post array modified", data);
        //   io.emit("userDataChange", data);
        // });

        // realtime listening to Post collection
        const postChangeStream = Post.watch().on("change", (data) => {
          Post.findById(data.documentKey).populate("author").exec((err3, populatedData) => {
            if (err3) console.log("cannot retrieve post");
            else io.emit("newsfeedChange", populatedData);
          });
        });

        io.on("connection", (socket) => {
          console.log("connected socket");
          socket.on("disconnect", () => {
            console.log("disconnect socket");
            console.log("closing realtime mongo");
            // userChangeStream.close();
            postChangeStream.close();
          });
        });

        // query all users and send back with token and self-user
        User.find().select("username displayName photoURL").exec((err3, users) => {
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

  User.findOne({ username }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.json({ errorMsg: "The username you entered doesn't belong to an account. Please check your username and try again." });

    bcrypt.compare(password, user.password, (err1, response) => {
      if (!response) return res.json({ errorMsg: "Sorry, your password was incorrect. Please double-check your password." });

      // // realtime listening to User collection
      // const userChangeStream = User.watch().on("change", (data) => {
      //   console.log("post array modified", data);
      //   io.emit("userDataChange", data);
      // });

      // realtime listening to Post collection
      const postChangeStream = Post.watch().on("change", (data) => {
        Post.findById(data.documentKey).populate("author").exec((err2, populatedData) => {
          if (err2) console.log("cannot retrieve post");
          else io.emit("newsfeedChange", populatedData);
        });
      });

      io.on("connection", (socket) => {
        console.log("connected socket");
        socket.on("disconnect", () => {
          console.log("disconnect socket");
          console.log("closing realtime mongo");
          // userChangeStream.close();
          postChangeStream.close();
        });
      });

      // query all users, newsfeed, and send back with token and self-user
      async.parallel({
        users: (callback) => {
          User.find().select("username displayName photoURL").exec(callback);
        },
        newsfeed: (callback) => {
          Post
            .find({ author: { $in: user.following.concat(user._id) } })
            .populate("author likes", "username displayName photoURL")
            .sort("-createdAt").exec(callback);
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
