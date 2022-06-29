const mongoose = require("mongoose");

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postCaption: { type: String },
    imageURL: { type: String, required: true },
    storageURL: { type: String, required: true },
    filePath: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment", required: true }],
  },
  { timestamps: true },
);

PostSchema
  .virtual("url")
  .get(function () { return `/p/${this._id}/`; });

// Export model
module.exports = mongoose.model("Post", PostSchema);
