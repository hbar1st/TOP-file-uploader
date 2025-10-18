const { Router } = require("express");

const fileRouter = Router();

const { getFileExplorer, uploadFile, updateFolder, createNewFolder, deleteFolder } = require("../controllers/fileController");

function protectRoute(req, res, next) {
  req.isAuthenticated() ? next() : res.redirect("/"); 
}

fileRouter.get("/explorer", protectRoute, getFileExplorer);

fileRouter.get("/explorer/:folderId", protectRoute, getFileExplorer);

fileRouter.post("/folder/new", protectRoute, createNewFolder);

fileRouter.post("/folder/update", protectRoute, updateFolder);

fileRouter.get("/folder/delete/:id", protectRoute, deleteFolder);

fileRouter.post("/upload", protectRoute, uploadFile)

module.exports = fileRouter;
