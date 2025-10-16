const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("../db/queries");
const bcrypt = require("bcrypt");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email", // This tells Passport to look for 'email' in the request body
      passwordField: "password",
    },
    async (email, password, done) => {
      console.log("trying to authenticate: ", email, password);
      try {
        const user = await db.findUser(email);
        if (user === null) {
          console.log("it's the wrong email address");
          return done(null, false, { message: "Incorrect email address." });
        }

        const match = await bcrypt.compare(email, user.password);

        if (!match) {
          // passwords do not match!
          console.log("it's the wrong password");
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  console.log("in serializeUser:", user);
  cb(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log("in deserializeUser: ", id)
  try {
    const { rows } = await db.findUserById(id);
    const user = rows[0];

    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;