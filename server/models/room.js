const mongoose = require("mongoose");

const { Schema } = mongoose;

const RoomSchema = new Schema(
  {
    members: {
      self: { type: Schema.Types.ObjectId, ref: "User", required: true },
      other: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    lastMessageSent: { type: String, required: true },
  },
  { timeStamps: true },
);

RoomSchema
  .virtual("url")
  .get(function () { `/chat/${this._id}/`; });

// Export model
module.exports = mongoose.model("Room", RoomSchema);
