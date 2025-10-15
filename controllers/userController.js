const db = require("../db/queries");

const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const passport = require("../middleware/passport");

/*
function authenticate(req, res, next) {
  console.log("calling passport authenticate next");
  return passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  });
}
*/

function getLoginForm(req, res) {
  console.log("sign-up or login: ", req.newUser);
  if (req.newUser) {
    res.render("signup", { signup: true });
  } else {
    res.render("signup", { signup: false });
  }
}

const validateUserFields = [
  body('username')
]
const signUp = [
  validateUserFields,
  (req, res) => {

  }
]
module.exports = {
  getLoginForm,
  signUp
};