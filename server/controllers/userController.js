const async = require("async");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Post = require("../models/post");
const HttpError = require("../HttpError");

exports.loginWithGoogle = (req, res, next) => {
  // console.log("profile data passed from google strategy", req.data);
  jwt.sign({ id: req.data._id }, "secretkey", { expiresIn: 60 * 15 }, (err, token) => {
    if (err) return next(HttpError.internal("Error when signing JWT."));
    res.cookie("jwtToken", token, { httpOnly: true });
    // console.log("token (from google) is ", token);
    // res.redirect("/success");
    res.redirect("http://localhost:3000");
  });
};

exports.getHomeData = (req, res, next) => {
  // console.log("in getHomeData");
  jwt.verify(req.jwtToken, "secretkey", (tokenErr, authData) => {
    if (tokenErr) return next(HttpError.forbidden("JWT verification failed."));

    // query user data based on payload id
    User.findById(authData.id)
      .populate("followers following rooms.members.other", "username displayName photoURL")
      .select("-notifications")
      .lean()
      .exec((queryErr, user) => {
        if (queryErr) return next(HttpError.internal("Database query error."));
        if (!user) return next(HttpError.notFound("User authentication failed."));

        // query all users, newsfeed, and send back with self-user
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
        }, (queryErr1, results) => {
          if (queryErr1) return next(HttpError.internal("Database query error."));
          return res.status(200).json({
            user, users: results.users, newsfeed: results.newsfeed,
          });
        });
      });
  });
};

exports.signupUser = (req, res, next) => {
  const { username, password, fullname } = req.body;

  User.findOne({ username })
    .populate("followers following rooms.members.other", "username displayName photoURL")
    .select("-notifications")
    .lean()
    .exec((queryErr, user) => {
      if (queryErr) return next(HttpError.internal("Database query error."));
      if (user) return next(HttpError.badRequest("The username is already in use by another account."));

      bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
        if (hashErr) return next(HttpError.internal("Error when hashing your password."));
        const user = new User({
          username,
          password: hashedPassword,
          displayName: fullname,
          provider: "local",
        });

        user.save((saveErr) => {
          if (saveErr) return next(HttpError.internal("Error when creating your account."));

          // query all users and send back with token and self-user
          User.find().select("username displayName photoURL").lean().exec((queryErr1, users) => {
            if (queryErr1) return next(HttpError.internal("Database query error."));
            jwt.sign({ id: user._id }, "secretkey", { expiresIn: 60 * 15 }, (err, token) => {
              if (err) return next(HttpError.internal("Error when signing JWT."));
              res.cookie("jwtToken", token, { httpOnly: true });
              // console.log("token generated", token);
              return res.status(200).json({
                user, users, newsfeed: [],
              });
            });
          });
        });
      });
    });
};

exports.loginUser = (req, res, next) => {
  const { username, password } = req.body;
  // console.log("req.headers", req.headers);

  User.findOne({ username })
    .populate("followers following rooms.members.other", "username displayName photoURL")
    .select("-notifications")
    .lean()
    .exec((queryErr, user) => {
      if (queryErr) return next(HttpError.internal("Database query error."));
      if (!user) return next(HttpError.badRequest("The username you entered doesn't belong to an account. Please check your username and try again."));

      bcrypt.compare(password, user.password, (pswdErr, response) => {
        if (pswdErr) return next(HttpError.badRequest("Sorry, your password was incorrect. Please double-check your password."));
        if (!response) return next(HttpError.badRequest("Sorry, your password was incorrect. Please double-check your password."));

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
        }, (queryErr1, results) => {
          if (queryErr1) return next(HttpError.internal("Database query error."));
          jwt.sign({ id: user._id }, "secretkey", { expiresIn: 60 * 15 }, (err, token) => {
            if (err) return next(HttpError.internal("Error when signing JWT."));
            res.cookie("jwtToken", token, { httpOnly: true });
            // console.log("token generated", token);
            return res.status(200).json({
              user, users: results.users, newsfeed: results.newsfeed,
            });
          });
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
      if (err) return next(HttpError.notFound("Error when retrieving this user's profile. No user found."));
      return res.status(200).json(data);
    });
};

exports.updateUserProfile = (req, res, next) => {
  const {
    photoURL, username, displayName, bio,
  } = req.body;
  User.findByIdAndUpdate(req.params._id, {
    $set: {
      username, photoURL, displayName, bio,
    },
  }, (err) => {
    if (err) return next(HttpError.internal("Error when editing profile. Please try again later."));
    return res.status(200).json("Success");
  });
};

exports.updateUserFollows = (req, res, next) => {
  const { type, otherId } = req.body;
  const selfId = req.params._id;
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
      user.save((saveErr) => {
        if (saveErr) return next(HttpError.internal("Error when handling follow toggle."));
        // if success, do waterfall updates
        async.waterfall([
          // update self's following
          function (callback) {
            User.findByIdAndUpdate(selfId, { $push: { following: otherId } }, { new: true }, (queryErr, updatedUser) => {
              if (queryErr) callback(queryErr);
              else callback(null, updatedUser);
            });
          },
          // update newsfeed in frontend
          function (updatedUser, callback) {
            Post
              .find({ author: { $in: updatedUser.following.concat(updatedUser._id) } })
              .populate("author likes comments.commenter", "username displayName photoURL")
              .lean()
              .sort("-createdAt")
              .exec((queryErr, newsfeed) => {
                if (queryErr) callback(queryErr);
                else callback(null, newsfeed);
              });
          },
        ], (queryErr, newsfeed) => {
          if (queryErr) return next(HttpError.internal("Error when handling follow toggle/querying newsfeed upon change in following list."));
          io.emit("newsfeedChange", { refreshedNewsfeed: newsfeed, for: selfId });
          return res.status(200).json("Success");
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
      if (err) return next(HttpError.internal("Error when handling follow toggle."));
      io.emit("newsfeedChange", { removedPostsOf: otherId, for: selfId });
      return res.status(200).json("Success");
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
      if (err) return next(HttpError.internal("Error when retrieving this user's notifications."));
      return res.status(200).json(data.notifications);
    });
};

exports.updateUserNotifications = (req, res, next) => {
  // console.log("req.body", req.body);
  // console.log("req.params._id", req.params._id);
  if (req.body.type === "chat") {
    User
      .findByIdAndUpdate(req.params._id, { unreadChatNotifs: 0 }, (err) => {
        // console.log(err, ".....", results);
        if (err) return next(HttpError.internal("Error when updating chat notifications."));
        // console.log("returning success for type CHAT");
        return res.status(200).json("Success");
      });
  } else {
    User
      .findByIdAndUpdate(req.params._id, { unreadNotifs: 0 }, (err) => {
        // console.log(err, ".....", results);
        if (err) return next(HttpError.internal("Error when updating notifications."));
        // console.log("returning success for type NONE");
        return res.status(200).json("Success");
      });
  }
};
