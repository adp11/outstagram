const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const mongoose = require("mongoose");
const User = require("./models/user");
require("dotenv").config();

// Set up passport
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.CLIENT_URL}/google/callback`,
    passReqToCallback: true,
  },
  ((req, accessToken, refreshToken, profile, done) => {
    const userId = mongoose.Types.ObjectId();
    const newUser = {
      username: `u_${userId}`,
      displayName: profile.displayName,
      photoURL: profile.photos[0].value,
      provider: "google",
      providerId: profile.id,
    };

    User.findOneAndUpdate(
      { providerId: profile.id },
      { $setOnInsert: newUser },
      { new: true, upsert: true },
      (err, updatedUser) => {
        if (err) return done(err);
        req.data = updatedUser;
        return done(null, updatedUser);
      },
    );
  }),
));
