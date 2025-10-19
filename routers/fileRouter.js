const { Router } = require('express')

const fileRouter = Router()

const {
  getFileExplorer, getFileDetails, uploadFile, deleteFile,
  updateFolder, createNewFolder, deleteFolder, setupCloud,
} = require('../controllers/fileController')

function protectRoute (req, res, next) {
  req.isAuthenticated() ? next() : res.redirect('/')
}

fileRouter.get('/explorer', protectRoute, getFileExplorer)

fileRouter.get('/explorer/:folderId', protectRoute, getFileExplorer)

fileRouter.get('/details/:folderId/:fileId', protectRoute, getFileDetails, getFileExplorer)

fileRouter.post('/folder/new', protectRoute, createNewFolder)

fileRouter.post('/folder/update', protectRoute, updateFolder)

fileRouter.get('/folder/delete/:id', protectRoute, deleteFolder)

fileRouter.post('/upload', protectRoute, uploadFile)

fileRouter.get('/delete/:id', protectRoute, deleteFile)

fileRouter.get('/*splat', protectRoute, getFileExplorer)

fileRouter.post("/*splat", protectRoute, getFileExplorer);

module.exports = fileRouter
