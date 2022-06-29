const mongoose = require("mongoose");

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, enum: ["like", "comment", "follow"] },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
  },
  { timeStamps: true },
);

// Export model
module.exports = mongoose.model("Notification", NotificationSchema);
