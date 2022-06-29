const mongoose = require("mongoose");

const { Schema } = mongoose;

const DUMMY_AVATAR_URL = "https://dummyimage.com/200x200/979999/000000.png&text=...";

const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    displayName: { type: String, required: true },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    notifications: [{ type: Schema.Types.ObjectId, ref: "Notification" }],
    rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
    photoURL: { type: String, default: DUMMY_AVATAR_URL },
    bio: { type: String, default: "" },
    unreadChatNotifs: { type: Number, min: 0, default: 0 },
    unreadNotifs: { type: Number, min: 0, default: 0 },
  },
);

const url = UserSchema.virtual("url");
url.get(function () { return `/u/${this._id}`; });

// console.log(url instanceof mongoose.VirtualType);
// UserSchema
//   .virtual("url")
//   .get(function () { return `/u/${this._id}/`; });

// Export model
module.exports = mongoose.model("User", UserSchema);
