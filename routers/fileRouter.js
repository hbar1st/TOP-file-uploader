const { Router } = require("express");

const fileRouter = Router();

const { getFileExplorer, createNewFolder } = require("../controllers/fileController");

function protectRoute(req, res, next) {
  req.isAuthenticated() ? next() : res.redirect("/"); 
}

fileRouter.get("/explorer", protectRoute, getFileExplorer);

fileRouter.get("/folder/new/:parentId", protectRoute, createNewFolder);

module.exports = fileRouter;
