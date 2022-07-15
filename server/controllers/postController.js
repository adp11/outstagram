const async = require("async");
const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/post");
const HttpError = require("../HttpError");

// Skip validation and sanitization
exports.addPost = (req, res, next) => {
  const post = new Post(req.body);
  post.save((err) => {
    if (err) return next(HttpError.internal("Error when adding your post."));

    const postSnippet = {
      _id: post._id,
      imageURL: post.imageURL,
      totalLikes: 0,
      totalComments: 0,
    };

    User.findByIdAndUpdate(req.body.author, { $push: { postSnippets: postSnippet } }, (queryErr) => {
      if (queryErr) return next(HttpError.internal("Database query error."));
      return res.status(200).json("Success");
    });
  });
};

exports.getPost = (req, res, next) => {
  Post
    .findById(req.params._id)
    .populate("author likes comments.commenter", "username displayName photoURL")
    .lean()
    .exec((err, data) => {
      if (err) return next(HttpError.notFound("Error when retrieving this post. No post found."));
      return res.status(200).json(data);
    });
};

exports.deletePost = (req, res, next) => {
  async.parallel([
    // update post itself
    function (callback) {
      Post.findByIdAndRemove(req.params._id, callback);
    },
    // update postSnippets
    function (callback) {
      User.updateOne(
        { _id: req.body.authorId },
        { $pull: { postSnippets: { _id: mongoose.Types.ObjectId(req.params._id) } } },
        callback,
      );
    },
  ], (err) => {
    if (err) return next(HttpError.internal("Error when deleting post."));
    return res.status(200).json("Success");
  });
};

exports.updatePostLikes = (req, res, next) => {
  const {
    type, likerId, authorId, isSelfLike,
  } = req.body;
  const postId = req.params._id;
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
    ], (err) => {
      if (err) return next(HttpError.internal("Error when handling like toggle."));
      return res.status(200).json("Success");
    });
  } else if (type === "like" && isSelfLike) {
    async.parallel([
      // update post itself
      function (callback) {
        Post.findByIdAndUpdate(postId, { $push: { likes: likerId } }, callback);
      },
      // update postSnippets
      function (callback) {
        User.updateOne(
          { _id: authorId, "postSnippets._id": mongoose.Types.ObjectId(postId) },
          { $inc: { "postSnippets.$.totalLikes": 1 } },
          callback,
        );
      },
    ], (err) => {
      if (err) return next(HttpError.internal("Error when handling like toggle."));
      return res.status(200).json("Success");
    });
  } else if (type === "like" && !isSelfLike) {
    async.parallel([
      // update post itself
      function (callback) {
        Post.findByIdAndUpdate(postId, { $push: { likes: likerId } }, callback);
      },
      // multiple updates for user
      function () {
        User.findOneAndUpdate(
          { _id: authorId, "postSnippets._id": mongoose.Types.ObjectId(postId) },
          { $inc: { unreadNotifs: 1, "postSnippets.$.totalLikes": 1 } }, // update postSnippets and unreadNotifs
          (err, user) => {
            user.notifications.push({ // push notifications
              from: likerId,
              to: authorId,
              type: "like",
              post: postId,
            });
            user.save((saveErr) => {
              if (saveErr) return next(HttpError.internal("Error when handling like toggle."));
            });
          },
        );
      },
    ], (err) => {
      if (err) return next(HttpError.internal("Error when handling like toggle."));
      return res.status(200).json("Success");
    });
  }
};

// Skip validation and sanitization
exports.updatePostComments = (req, res, next) => {
  const {
    type, commenterId, authorId, isSelfComment, content,
  } = req.body;
  const postId = req.params._id;

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
      ], (queryErr) => {
        if (queryErr) return next(HttpError.internal("Error when adding your comment"));
        return res.status(200).json("Success");
      });
    } else {
      async.parallel([
        // update post itself
        function (callback) {
          post.comments.push({ commenter: commenterId, content });
          post.save(callback);
        },
        // multiple updates for user
        function () {
          User.findOneAndUpdate(
            { _id: authorId, "postSnippets._id": mongoose.Types.ObjectId(postId) },
            { $inc: { unreadNotifs: 1, "postSnippets.$.totalComments": 1 } }, // update postSnippets and unreadNotifs
            (err, user) => {
              user.notifications.push({ // push notifications
                from: commenterId,
                to: authorId,
                type: "comment",
                post: postId,
                commentContent: content,
              });
              user.save((saveErr) => {
                if (saveErr) return next(HttpError.internal("Error when adding your comment."));
                return res.status(200).json("Success");
              });
            },
          );
        },
      ], (queryErr1) => {
        if (queryErr1) return next(HttpError.internal("Error when adding your comment."));
        return res.status(200).json("Success");
      });
    }
  });
};
