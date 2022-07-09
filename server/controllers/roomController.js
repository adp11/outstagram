const async = require("async");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/user");
const Room = require("../models/room");

exports.createRoom = (req, res, next) => {
  const { selfId, otherId } = req.body;
  async.parallel([
    function (callback) {
      User
        .findById(selfId)
        .select("rooms")
        .exec(callback);
    },
    function (callback) {
      User
        .findById(otherId)
        .select("rooms")
        .exec(callback);
    },
  ], (err, users) => {
    const selfUser = users[0];
    const otherUser = users[1];
    const pos = selfUser.rooms.findIndex((room) => room.members.other.toString() === otherId);

    if (pos === -1) { // if room does not exist
      const roomId = mongoose.Types.ObjectId();
      // add to field "rooms" of selfId
      selfUser.rooms.push({
        _id: roomId,
        members: {
          self: selfId,
          other: otherId,
        },
        lastMessageSent: null,
      });
      // add to field "rooms" of otherId
      otherUser.rooms.push({
        _id: roomId,
        members: {
          self: otherId,
          other: selfId,
        },
        lastMessageSent: null,
      });

      // save both user Ids and create full room
      async.parallel([
        function (callback) {
          selfUser.save(callback);
        },
        function (callback) {
          otherUser.save(callback);
        },
        function (callback) {
          Room.create({ _id: roomId, messages: [] }, callback);
        },
      ], (err1, result) => {
        if (err1) return res.json({ errorMsg: "Error when creating chat room. Please try again." });
        res.redirect(`/rooms/${roomId}/?justCreated=true`);
      });
    } else {
      res.redirect(`/rooms/${selfUser.rooms[pos]._id}/?justCreated=false`);
    }
  });
};

exports.deleteRoom = (req, res, next) => {
  const { selfId, otherId } = req.body;
  async.parallel([
    // update room collection itself
    function (callback) {
      Room.findByIdAndRemove(req.params._id, callback);
    },
    // update rooms in user collection
    function (callback) {
      User.updateOne(
        { _id: selfId },
        { $pull: { rooms: { _id: mongoose.Types.ObjectId(req.params._id) } } },
        callback,
      );
    },
    function (callback) {
      User.updateOne(
        { _id: otherId },
        { $pull: { rooms: { _id: mongoose.Types.ObjectId(req.params._id) } } },
        callback,
      );
    },
  ], (err, results) => {
    if (err) return res.json({ errorMsg: "Error when deleting room" });
    return res.json({ successMsg: "Deleted null rooms!" });
  });
};

exports.getRoom = (req, res, next) => {
  Room
    .findById(req.params._id)
    .populate("messages.from", "username displayName photoURL")
    .lean()
    .exec((err, data) => {
      if (err) return res.json({ errorMsg: "Error when retrieving this room's messages." });
      return res.json({ ...data, justCreated: (req.query.justCreated === "true") });
    });
};

/* Where to update?
  "rooms" field in both "from" and "to"
  inc chatNotifs for "to"
  push to "messages" field in Room collection
*/
exports.addMessage = (req, res, next) => {
  const {
    messageId, from, to, message, imageURL, storageURL,
  } = req.body;
  const io = req.app.get("socketio");

  async.parallel([
    // find room document
    function (callback) {
      Room.findById(req.params._id).exec(callback);
    },
    // updates for self user
    function (callback) {
      User.findOneAndUpdate(
        { _id: from, "rooms._id": mongoose.Types.ObjectId(req.params._id) },
        { $set: { "rooms.$.lastMessageSent": message } }, // update rooms
        callback,
      );
    },
    // updates for the other user
    function (callback) {
      User
        .findOneAndUpdate(
          { _id: to, "rooms._id": mongoose.Types.ObjectId(req.params._id) },
          { $inc: { unreadChatNotifs: 1 }, $set: { "rooms.$.lastMessageSent": message } }, // update unreadChatNotifs and rooms
          { new: true },
        ).populate("rooms.members.other", "username displayName photoURL").exec(callback);
    },
  ], (err, results) => {
    if (err) return res.json({ errorMsg: "Error when adding message" });

    const room = results[0];
    const msg = {
      _id: messageId,
      from,
      message,
      imageURL,
      storageURL,
    };
    room.messages.push(msg); // save message to the room founded above
    room.save((err1, updatedRoom) => {
      if (err1) return res.json({ errorMsg: "Error when adding message" });
      updatedRoom.populate("messages.from", "username displayName photoURL", (err2, populatedRoom) => {
        if (err2) return res.json({ errorMsg: "Error when adding message" });
        console.log("emit many times?");
        io.emit("messaging", { populatedRoom, to });
        return res.json({ successMsg: "Sent message successfully" });
      });
    });
  });
};
