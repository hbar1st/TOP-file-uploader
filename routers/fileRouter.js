const { Router } = require("express");

const fileRouter = Router();

const { getFileExplorer, updateFolder, createNewFolder, deleteFolder } = require("../controllers/fileController");

function protectRoute(req, res, next) {
  req.isAuthenticated() ? next() : res.redirect("/"); 
}

function authorizeUser(req, res, next) {
  const user = res.locals.currentUser;
  user.id === req.body.authorId ? next() : res.redirect("/");
}
fileRouter.get("/explorer", protectRoute, getFileExplorer);

fileRouter.get("/explorer/:folderId", protectRoute, getFileExplorer);

fileRouter.post("/folder/new", protectRoute, createNewFolder);

fileRouter.post("/folder/update", protectRoute, updateFolder);

fileRouter.get("/folder/delete/:id", protectRoute, deleteFolder);

module.exports = fileRouter;
