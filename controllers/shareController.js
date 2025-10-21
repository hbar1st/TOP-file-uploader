const { body, param, validationResult } = require("express-validator");

const {
  getFolder,
  getFiles,
  getFolders,
  removeShareSettings,
  findRootSharedFolder,
  updateFolder: dbUpdateFolder,
} = require("../db/fileQueries");

const {
  basicFolderIdCheck,
  msToDays,
  getPathsForDisplay,
} = require("../utils/utils");


const getPublicExplorer = [
  basicFolderIdCheck(param('folderId')),
  async (req, res, next) => {
    console.log("in getPublicExplorer: ", req.params.userId, req.params.folderId, req.params.sharedId)
    let rootFolder = await getFolder(req.params.userId, req.params.folderId)
    if (!rootFolder) {
      res.status(400);
      next(new CustomNotFoundError({ msg: 'The folder cannot be found.' }))
    }
    
    const folder = rootFolder; // initially assume the folder we're viewing is the one originally shared

    // 1- the sharedId must match the one given in the URL
    // 2- the expiry should not have passed
    if (rootFolder.sharedId !== req.params.sharedId) {
      // if the sharedId then this folder may be a descendant, but we need to make sure first
      rootFolder = await findRootSharedFolder(req.params.userId, req.params.sharedId, folder.pathArr);
      console.log("found the root shared folder: ",rootFolder);
      if (!rootFolder) {
        next(new Error({msg: 'Invalid request'}))
      }
    }
    // figure out if share has expired
    const remMS = BigInt(rootFolder.shareExpiry) - BigInt(Date.now());
    const shareRem = msToDays(remMS);
    
    if (remMS > 0) {
      rootFolder.daysToExpire = rootFolder.shareExpiry
      ? `${shareRem.days} days, ${shareRem.hours} hours`
      : "0 days";
    } else {
      // if the expiry date has in fact passed, update the db and remove the sharedId and shareExpiry to blank/0 again
      // and show the user a 404 page?
      // run an async update call to clear out the shareExpiry and sharedId since the duration time has expired
      try {
        const folder = await removeShareSettings(rootFolder.id)
      } catch (error) {
        console.log(error);
      }
      res.status(401)
      next(new Error({ msg: "This share has expired" }));
    }
        
    const userId = rootFolder.authorId;
    const files = await getFiles(userId, folder.id)
    
    console.log('in getFileExplorer - retrieved files: ', files)
    const folders = await getFolders(userId, folder.id)
    console.log('in getFileExplorer - retrieved folders: ', folders)
    console.log('root folder: ', rootFolder)
    console.log('current folder: ', folder)
    
    let isRootFolder = false
    if (rootFolder.name === '/') {
      isRootFolder = true
    }
    let errors = validationResult(req)
    if (req.errors) {
      errors = [...errors.array(), ...req.errors]
    } else {
      errors = errors.array()
    }
    console.log('file-explorer ERRORS? ', errors)
    
    const paths = await getPathsForDisplay(
      userId,
      folder.id,
      req.params.sharedId
    );
    
    const viewVariables = {
      userId,
      folder,
      folders,
      files,
      isRootFolder,
      paths,
      sharedId: req.params.sharedId,
    };
    if (errors.length > 0) {
      next(errors);
    } else {
      console.log(paths)
      res.render('public-explorer', viewVariables)
    }
  }
]

module.exports = {
  getPublicExplorer,
};