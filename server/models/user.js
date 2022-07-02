const mongoose = require("mongoose");

const { Schema } = mongoose;

const DUMMY_AVATAR_URL = "https://dummyimage.com/200x200/979999/000000.png&text=...";

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

const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    displayName: { type: String, required: true },

    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
    notifications: [NotificationSchema],

    postSnippets: { type: Array, default: [] },
    photoURL: { type: String, default: DUMMY_AVATAR_URL },
    bio: { type: String, default: "" },
    unreadChatNotifs: { type: Number, min: 0, default: 0 },
    unreadNotifs: { type: Number, min: 0, default: 0 },
  },
);

// Export model
module.exports = mongoose.model("User", UserSchema);
