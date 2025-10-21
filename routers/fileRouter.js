const { Router } = require('express')

const fileRouter = Router()

const { getFileDetails, downloadFile } = require("../utils/utils");

const {
  getFileExplorer, uploadFile, deleteFile,
  updateFolder, createNewFolder, deleteFolder, getShareFolder,
  shareFolder
} = require('../controllers/fileController')

function protectRoute (req, res, next) {
  req.isAuthenticated() ? next() : res.redirect('/')
}

fileRouter.get('/explorer', protectRoute, getFileExplorer)

fileRouter.get('/explorer/:folderId', protectRoute, getFileExplorer)

fileRouter.get('/details/:folderId/:fileId', protectRoute, getFileDetails, getFileExplorer)

fileRouter.post('/folder/new', protectRoute, createNewFolder)

fileRouter.post('/folder/update', protectRoute, updateFolder)

fileRouter.get('/folder/share/:folderId', protectRoute, getShareFolder)

fileRouter.post('/folder/share', protectRoute, shareFolder)

fileRouter.get('/folder/delete/:id', protectRoute, deleteFolder)

fileRouter.post('/upload', protectRoute, uploadFile)

fileRouter.get('/delete/:id', protectRoute, deleteFile)

fileRouter.get('/download/:id', protectRoute, downloadFile)

fileRouter.get('/*splat', protectRoute, getFileExplorer)

fileRouter.post('/*splat', protectRoute, getFileExplorer)

module.exports = fileRouter
