const { Router } = require("express");

const userRouter = Router();

const { loginUser } = require("../controllers/userController");

userRouter.get("/", loginUser);

module.exports = userRouter;
