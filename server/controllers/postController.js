const async = require("async");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Post = require("../models/post");

exports.addPost = (req, res, next) => {
  const io = req.app.get("socketio");

  const post = new Post(req.body);
  post.save((err) => {
    if (err) return res.json({ errorMsg: "Error when adding your post. Please try again." });

    User.findByIdAndUpdate(req.body.author, { $push: { posts: post._id } }, (err1, user) => {
      if (err1) return res.json({ errorMsg: "Error when adding your post. Please try again." });

      return res.json({ user });
    });
  });
};
