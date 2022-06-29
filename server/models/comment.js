const mongoose = require("mongoose");

const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
  },
  { timeStamps: true },
);

// Export model
module.exports = mongoose.model("Comment", CommentSchema);
