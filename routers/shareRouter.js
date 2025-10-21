const { Router } = require('express')

const shareRouter = Router()

const { getFileDetails, downloadFile } = require("../utils/utils");

const {
  getPublicExplorer,
} = require("../controllers/shareController");


shareRouter.get("/folder/:userId/:folderId/:sharedId", getPublicExplorer);

shareRouter.get("/file/:userId/:parentId/:sharedId/:fileId", getFileDetails);

//http://localhost:3000/shared/folder/4/51/55-0734ec325984c986ce87e6b84682/55

shareRouter.get("/folder/:userId/:folderId/:sharedId/download/:id", getFileDetails, downloadFile)

module.exports = shareRouter;

