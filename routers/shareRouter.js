const { Router } = require('express')

const shareRouter = Router()

const { getFileDetails } = require("../utils/utils");

const {
  getPublicExplorer,
} = require("../controllers/shareController");


shareRouter.get("/folder/:userId/:folderId/:sharedId", getPublicExplorer);

shareRouter.get("/folder/:userId/:folderId/:sharedId/:fileId", getFileDetails, getPublicExplorer);

//shareRouter.get("/folder/:userId/:folderId/:sharedId/download/:fileId", getFileDetails, downloadFile)

module.exports = shareRouter;

