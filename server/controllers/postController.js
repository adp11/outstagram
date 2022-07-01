const async = require("async");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/post");
const Notification = require("../models/notification");

// Skip validation and sanitization
exports.addPost = (req, res, next) => {
  const post = new Post(req.body);
  post.save((err) => {
    if (err) return res.json({ errorMsg: "Error when adding your post. Please try again." });

    const postSnippet = {
      _id: post._id,
      imageURL: post.imageURL,
      totalLikes: 0,
      totalComments: 0,
    };

    User.findByIdAndUpdate(req.body.author, { $push: { postSnippets: postSnippet } }, (err1, user) => {
      if (err1) return res.json({ errorMsg: "Error when adding your post. Please try again." });
      return res.json({ successMsg: "Added post!" });
    });
  });
};

// like: post, notif (not self like), postSNippet, unreadNotifs
// unlike: post, postSnippet
exports.handleLikePost = (req, res, next) => {
  const {
    type, likerId, postId, authorId, isSelfLike,
  } = req.body;
  if (type === "unlike") {
    async.parallel([
      // update post itself
      function (callback) {
        Post.findByIdAndUpdate(postId, { $pull: { likes: likerId } }, callback);
      },
      // update postSnippets
      function (callback) {
        User.updateOne(
          { _id: authorId, "postSnippets._id": mongoose.Types.ObjectId(postId) },
          { $inc: { "postSnippets.$.totalLikes": -1 } },
          callback,
        );
      },
    ], (err, results) => {
      console.log("results after handle", results[1]);
      console.log("err?", err);
      if (err) return res.json({ errMsg: "Error when handling like." });
    });
  } else if (type === "like" && isSelfLike) {
    async.parallel([
      // update post itself
      function (callback) {
        Post.findByIdAndUpdate(postId, { $push: { likes: likerId } }, callback);
      },
      // update postSnippets
      function (callback) {
        console.log(authorId, "update postSnippets triggered?", postId);
        console.log();
        User.updateOne(
          { _id: authorId, "postSnippets._id": mongoose.Types.ObjectId(postId) },
          { $inc: { "postSnippets.$.totalLikes": 1 } },
          callback,
        );
      },
    ], (err, results) => {
      console.log("results after handle", results[1]);
      console.log("err?", err);
      if (err) return res.json({ errMsg: "Error when handling like." });
    });
  } else if (type === "like" && !isSelfLike) {
    async.parallel([
      // update post itself
      function (callback) {
        Post.findByIdAndUpdate(postId, { $push: { likes: likerId } }, callback);
      },
      // update notifications
      function () {
        Notification.create({
          from: likerId,
          to: authorId,
          type: "like",
          post: postId,
        });
      },
      // update unreadNotifs
      function (callback) {
        User.findByIdAndUpdate(authorId, { $inc: { unreadNotifs: 1 } }, callback);
      },
      // update postSnippets
      function (callback) {
        User.updateOne(
          { _id: authorId, "postSnippets._id": mongoose.Types.ObjectId(postId) },
          { $inc: { "postSnippets.$.totalLikes": 1 } },

          callback,
        );
      },
    ], (err, results) => {
      if (err) return res.json({ errMsg: "Error when handling like." });
    });
  }
};

// Skip validation and sanitization
exports.addComment = (req, res, next) => {
  const {
    type, commenterId, postId, authorId, isSelfComment, content,
  } = req.body;

  Post.findOne({ _id: postId }).exec((err, post) => {
    if (type === "comment" && isSelfComment) {
      async.parallel([
        // update post itself
        function (callback) {
          post.comments.push({ commenter: commenterId, content });
          post.save(callback);
        },
        // update postSnippets
        function (callback) {
          User.updateOne(
            { _id: authorId, "postSnippets._id": mongoose.Types.ObjectId(postId) },
            { $inc: { "postSnippets.$.totalComments": 1 } },
            callback,
          );
        },
      ], (err1, results) => {
        console.log("results after handle", results);
        console.log("err?", err1);
        if (err1) return res.json({ errMsg: "Error when adding your comment. Please try again." });
        return res.json({ successMsg: "Added comment!" });
      });
    } else {
      async.parallel([
        // update post itself
        function (callback) {
          post.comments.push({ commenter: commenterId, content });
          post.save(callback);
        },
        // update notifications
        function (callback) {
          const notification = new Notification({
            from: commenterId,
            to: authorId,
            type: "comment",
            post: postId,
            commentContent: content,
          });
          notification.save(callback);
        },
        // update unreadNotifs
        function (callback) {
          User.findByIdAndUpdate(authorId, { $inc: { unreadNotifs: 1 } }, callback);
        },
        // update postSnippets
        function (callback) {
          User.updateOne(
            { _id: authorId, "postSnippets._id": mongoose.Types.ObjectId(postId) },
            { $inc: { "postSnippets.$.totalComments": 1 } },
            callback,
          );
        },
      ], (err1, results) => {
        console.log("results after handle", results);
        console.log("err?", err1);
        if (err1) return res.json({ errMsg: "Error when adding your comment. Please try again." });
        return res.json({ successMsg: "Added comment!" });
      });
    }
  });
};
