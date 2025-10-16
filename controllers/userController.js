const {findUser, addNewUser} = require("../db/userQueries");
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
  .withMessage("Provide a valid email address.")
  .custom(async (value, { req }) => {
    console.log("try to validate if the email is unique: ", value);
    const userRow = await findUser(value);
    console.log(userRow);
    if (userRow) {
      throw new Error("This email has already been registered. You must login instead.");
    } else {
      return true;
    }
  }),
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
  async (req, res, next) => {
    const errors = validationResult(req);
    
    console.log("ERRORS? ", errors);
    if (!errors.isEmpty()) {
      res.render("signup", { signup: true , errors: errors.array() });
    } else {
      const hashedPassword = bcrypt.hashSync(req.body.password, 7);
      const newUser = addNewUser(req.body.username, req.body.email, hashedPassword);
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