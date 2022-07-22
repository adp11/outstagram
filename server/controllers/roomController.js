const async = require("async");
const mongoose = require("mongoose");
const User = require("../models/user");
const Room = require("../models/room");
const HttpError = require("../models/HttpError");
require("dotenv").config();

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
    if (err) return next(HttpError.internal("Error when creating chat room."));
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
      ], (saveErr) => {
        if (saveErr) return next(HttpError.internal("Error when creating chat room."));
        res.redirect(`/rooms/${roomId}/?justCreated=true`);
      });
    } else {
      res.redirect(`/rooms/${selfUser.rooms[pos]._id}/?justCreated=false`);
    }
  });
};

exports.getRoom = (req, res, next) => {
  Room
    .findById(req.params._id)
    .populate("messages.from", "username displayName photoURL")
    .lean()
    .exec((err, data) => {
      if (err) return next(HttpError.notFound("Error when retrieving this room's messages."));
      return res.status(200).json({ ...data, justCreated: (req.query.justCreated === "true") });
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
    if (err) return next(HttpError.internal("Error when adding message."));

    const room = results[0];
    const msg = {
      _id: messageId,
      from,
      message,
      imageURL,
      storageURL,
    };
    room.messages.push(msg); // save message to the room founded above
    room.save((saveErr, updatedRoom) => {
      if (saveErr) return next(HttpError.internal("Error when adding message."));
      updatedRoom.populate("messages.from", "username displayName photoURL", (populateErr, populatedRoom) => {
        if (populateErr) return next(HttpError.internal("Error when adding message."));
        // console.log("emit many times?");
        io.emit("messaging", { populatedRoom, to });
        return res.status(200).json("Success");
      });
    });
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
  ], (err) => {
    if (err) return next(HttpError.notFound("Error when deleting room."));
    return res.status(200).json("Success");
  });
};
