const { Router } = require("express");

const userRouter = Router();

const { getLoginForm, signUp } = require("../controllers/userController");

userRouter.get("/", (req, res) => getLoginForm({ newUser: true, ...req }, res));

userRouter
  .route("/sign-up")
  .get((req, res) => getLoginForm({ newUser: true, ...req }, res))
  .post(signUp);
  
  userRouter
    .route("/login")
    .get((req, res) => getLoginForm({ newUser: false, ...req }, res))
    .post((req, res) => {});

module.exports = userRouter;
