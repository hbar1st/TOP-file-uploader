const { Router } = require("express");

const userRouter = Router();

const { getLoginForm, signUp, authenticate } = require("../controllers/userController");

userRouter.get("/", (req, res) => getLoginForm({ newUser: true, ...req }, res));

userRouter
  .route("/sign-up")
  .get((req, res) => getLoginForm({ newUser: true, ...req }, res))
  .post(signUp);
  
  userRouter
    .route("/login")
    .get((req, res) => getLoginForm({ newUser: false, ...req }, res))
    .post(authenticate, (req, res) => { console.log("hmm, why am I here? ")});

userRouter.route("/file-explorer").get((req, res) => { console.log("display file explorer!") });

module.exports = userRouter;
