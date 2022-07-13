const mongoose = require("mongoose");

const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    commenter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

const PostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },

    postCaption: { type: String },
    imageURL: { type: String, required: true },
    storageURL: { type: String, required: true },
    filePath: { type: String, required: true },

    likes: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    comments: [CommentSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", PostSchema);
