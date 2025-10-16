const { Router } = require("express");

const fileRouter = Router();

const { getFileExplorer } = require("../controllers/fileController");

function protectRoute(req, res, next) {
  req.isAuthenticated() ? next() : res.redirect("/"); 
}

fileRouter.get("/explorer", protectRoute, getFileExplorer)

module.exports = fileRouter;
