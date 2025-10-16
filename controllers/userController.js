const db = require("../db/queries");
const ve = require("../errors/ValidationError");

const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const passport = require("../middleware/passport");


function authenticate(req, res, next) {
  console.log("calling passport authenticate next: ", req.body.email, req.body.password);
  return passport.authenticate("local", {
    successRedirect: "/file-explorer",
    failureRedirect: "/login",
    failureMessage: true,
  });
}


function getLoginForm(req, res) {
  console.log("sign-up or login: ", req.newUser);
  if (req.newUser) {
    res.render("signup", { signup: true });
  } else {
    res.render("signup", { signup: false });
  }
}

const validateUserFields = [
  body("username").trim().notEmpty().withMessage("A name is required."),
  body("email")
  .trim()
  .notEmpty()
  .withMessage("An email is required.")
  .isEmail()
  .withMessage("Provide a valid email address."),
  body("password").trim().notEmpty().withMessage("A password is required."),
  body("confirm-password").trim().notEmpty().withMessage("A password confirmation is required.")
  .custom((value, { req }) => {
    console.log(value, req.body.password);
    if (value !== req.body.password) {
      throw new Error("The password confirmation must match the password value.");
    } else {
      return true;
    }
  }),
];
const signUp = [
  validateUserFields,
  async (req, res) => {
    const errors = validationResult(req);
    
    console.log("ERRORS? ", errors);
    if (!errors.isEmpty()) {
      res.render("signup", { signup: true , errors: errors.array() });
    } else {
      const hashedPassword = bcrypt.hashSync(req.body.password, 7);
      const newUser = db.addNewUser(req.body.username, req.body.email, hashedPassword);
      req.login(newUser, function (err) {
        if (err) {
          return next(err);
        }
        res.redirect("/file-explorer");
      });
    }
  }
]
module.exports = {
  getLoginForm,
  signUp,
  authenticate,
  
};