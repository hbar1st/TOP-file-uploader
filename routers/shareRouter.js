const { Router } = require('express')

const shareRouter = Router()

const {
  getPublicExplorer,
} = require("../controllers/shareController");


shareRouter.get("/folder/:userId/:folderId/:sharedId", getPublicExplorer);

// shareRouter.get("/folder/:userId/:folderId/:sharedId/:fileId", getFileDetails, getPublicExplorer);

module.exports = shareRouter;

