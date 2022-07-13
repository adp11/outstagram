const mongoose = require("mongoose");

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    imageURL: { type: String },
    storageURL: { type: String },
  },
  { timestamps: true },
);

const RoomSchema = new Schema(
  {
    messages: [MessageSchema],
  },
);

module.exports = mongoose.model("Room", RoomSchema);
