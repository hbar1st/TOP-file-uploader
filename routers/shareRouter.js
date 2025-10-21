const { Router } = require('express')

const shareRouter = Router()

const { getFileDetails, downloadFile } = require("../utils/utils");

const {
  getPublicExplorer,
} = require("../controllers/shareController");


shareRouter.get("/folder/:userId/:folderId/:sharedId", getPublicExplorer);

shareRouter.get("/folder/:userId/:folderId/:sharedId/:fileId", getFileDetails);

shareRouter.get("/folder/:userId/:folderId/:sharedId/download/:id", getFileDetails, downloadFile)

module.exports = shareRouter;

