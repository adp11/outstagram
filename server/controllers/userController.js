const async = require("async");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Post = require("../models/post");

exports.signupUser = (req, res, next) => {
  const { username, password, fullname } = req.body;
  const io = req.app.get("socketio");

  User.findOne({ username })
    .populate("followers following rooms.members.other", "username displayName photoURL")
    .select("-notifications")
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
            console.log("new connection between 1 client and 1 socketId (only join, not receive)", socket.id);
            console.log(user._id.toString());
            socket.join(user._id.toString());
            socket.on("disconnect", () => {
              console.log("close connection forced from client side", socket.id);
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
    .populate("followers following rooms.members.other", "username displayName photoURL")
    .select("-notifications")
    .lean()
    .exec((err, user) => {
      if (err) return next(err);
      if (!user) return res.json({ errorMsg: "The username you entered doesn't belong to an account. Please check your username and try again." });

      bcrypt.compare(password, user.password, (err1, response) => {
        if (!response) return res.json({ errorMsg: "Sorry, your password was incorrect. Please double-check your password." });

        io.on("connection", (socket) => {
          console.log("new connection between 1 client and 1 socketId (only join, not receive)", socket.id);
          socket.on("disconnect", () => {
            console.log("close connection forced from client side", socket.id);
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

exports.getUserProfile = (req, res, next) => {
  User
    .findById(req.params._id)
    .populate("followers following", "username displayName photoURL")
    .select("-password -rooms -unreadChatNotifs -unreadNotifs -notifications")
    .lean()
    .exec((err, data) => {
      if (err) return res.json({ errorMsg: "Error when retrieving this user's profile. No user found" });
      return res.json(data);
    });
};

exports.handleFollowToggle = (req, res, next) => {
  const { type, selfId, otherId } = req.body;
  const io = req.app.get("socketio");

  if (type === "follow") {
    // update other's followers and push notifications
    User.findByIdAndUpdate(otherId, {
      $push: { followers: selfId }, // other's followers
      $inc: { unreadNotifs: 1 }, // other's unreadNotifs
    }, (err, user) => {
      user.notifications.push({ // push main notification
        from: selfId,
        to: otherId,
        type: "follow",
      });
      user.save((err1) => {
        if (err1) return res.json({ errorMsg: "Error when handling follow toggle." });
        // if success, do waterfall updates
        async.waterfall([
          // update self's following
          function (callback) {
            User.findByIdAndUpdate(selfId, { $push: { following: otherId } }, { new: true }, (err, updatedUser) => {
              if (err) return err;
              callback(null, updatedUser);
            });
          },
          // update newsfeed in frontend
          function (updatedUser, callback) {
            Post
              .find({ author: { $in: updatedUser.following.concat(updatedUser._id) } })
              .populate("author likes comments.commenter", "username displayName photoURL")
              .lean()
              .sort("-createdAt")
              .exec((err, newsfeed) => {
                callback(null, newsfeed);
              });
          },
        ], (err2, newsfeed) => {
          if (err2) return res.json({ errorMsg: "Error when handling follow toggle/querying newsfeed upon change in following list." });
          io.emit("newsfeedChange", { refreshedNewsfeed: newsfeed, for: selfId });
        });
      });
    });
  } else if (type === "unfollow") {
    async.parallel([
      // update self's following
      function (callback) {
        User.findByIdAndUpdate(selfId, { $pull: { following: otherId } }, callback);
      },
      // update other's followers
      function (callback) {
        User.findByIdAndUpdate(otherId, { $pull: { followers: selfId } }, callback);
      },
    ], (err) => {
      if (err) return res.json({ errorMsg: "Error when handling follow toggle." });
      io.emit("newsfeedChange", { removedPostsOf: otherId, for: selfId });
    });
  }
};

exports.getUserNotifications = (req, res, next) => {
  User
    .findById(req.params._id)
    .populate("notifications.from notifications.to notifications.post", "username displayName photoURL imageURL createdAt")
    .select("notifications")
    .lean()
    .exec((err, data) => {
      if (err) return res.json({ errorMsg: "Error when retrieving this user's notifications." });
      return res.json(data.notifications);
    });
};

exports.updateUserNotifications = (req, res, next) => {
  console.log("req.body", req.body);
  console.log("req.params._id", req.params._id);
  if (req.body.type === "chat") {
    User
      .findByIdAndUpdate(req.params._id, { unreadChatNotifs: 0 }, (err, results) => {
        // console.log(err, ".....", results);
        if (err) return res.json({ errorMsg: "Error when updating chat notifications." });
        console.log("returning success for type CHAT");
        return res.json({ successMsg: "reset notifs!" });
      });
  } else {
    User
      .findByIdAndUpdate(req.params._id, { unreadNotifs: 0 }, (err, results) => {
        // console.log(err, ".....", results);
        if (err) return res.json({ errorMsg: "Error when updating notifications." });
        console.log("returning success for type NONE");
        return res.json({ successMsg: "reset notifs!" });
      });
  }
};
