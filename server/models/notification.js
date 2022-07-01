const mongoose = require("mongoose");

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, enum: ["like", "comment", "follow"] },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    commentContent: { type: String },
  },
  { timestamps: true },
);

// Export model
module.exports = mongoose.model("Notification", NotificationSchema);
