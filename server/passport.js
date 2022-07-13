const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const mongoose = require("mongoose");
const User = require("./models/user");

// Set up passport
const GOOGLE_CLIENT_ID = "858662058213-upqh7moacqonn13vg1dj0goq3pulu4vr.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

passport.use(new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/google/callback",
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
        // console.log("error in passport strategy", err);
        // console.log("result in passport strategy", updatedUser);
        if (err) return done(err);
        req.data = updatedUser;
        return done(null, updatedUser);
      },
    );
  }),
));
