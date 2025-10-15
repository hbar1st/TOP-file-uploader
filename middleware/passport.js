const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("../db/queries");
const bcrypt = require("bcrypt");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    console.log("trying to authenticate: ", username, password);
    try {
      const user = await db.findUser(username);
      if (user === null) {
        console.log("it's the wrong user name");
        return done(null, false, { message: "Incorrect username." });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        // passwords do not match!
        console.log("it's the wrong password");
        return done(null, false, { message: "Incorrect password" });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user)
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

module.exports = passport;