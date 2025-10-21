const { Router } = require('express')

const userRouter = Router()

const { getLoginForm, signUp, authenticate } = require('../controllers/userController')

function clearOldErrors(req, res, next) {
  delete req.errors;
  next();
}
userRouter.get(
  "/",
  clearOldErrors,
  (req, res) => getLoginForm({ newUser: true, ...req }, res)
);

userRouter
  .route("/sign-up")
  .get(
   clearOldErrors,
    (req, res) => getLoginForm({ newUser: true, ...req }, res)
  )
  .post(signUp);

userRouter
  .route('/login')
  .get(clearOldErrors, (req, res) => getLoginForm({ newUser: false, ...req }, res))
  .post(authenticate)

userRouter.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err)
    }
    res.redirect('/')
  })
})

module.exports = userRouter
