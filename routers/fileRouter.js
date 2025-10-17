const { Router } = require("express");

const fileRouter = Router();

const { getFileExplorer, createNewFolder, deleteFolder } = require("../controllers/fileController");

function protectRoute(req, res, next) {
  req.isAuthenticated() ? next() : res.redirect("/"); 
}

fileRouter.get("/explorer", protectRoute, getFileExplorer);

fileRouter.get("/explorer/:folderId", protectRoute, getFileExplorer);

fileRouter.post("/folder/new", protectRoute, createNewFolder);

fileRouter.get("/folder/delete/:id", protectRoute, deleteFolder);

module.exports = fileRouter;
