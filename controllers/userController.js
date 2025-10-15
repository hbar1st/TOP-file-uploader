const db = require("../db/queries");

const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const passport = require("../middleware/passport");


function authenticate(req, res, next) {
  console.log("calling passport authenticate next");
  return passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  });
}

function loginUser(req, res) {
  res.render("signupform");
}

module.export = {
  loginUser,
}