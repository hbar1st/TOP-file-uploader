const { body, param, validationResult } = require("express-validator");

const {
  getFolder,
  getFiles,
  getFolders,
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
      rootFolder = await getFolder(req.params.userId, req.params.folderId)
      if (!rootFolder) {
        throw new CustomNotFoundError('The folder cannot be found.')
      }
      //check if the folderId is in fact shared at this moment
      // 1- the sharedId must match the one given in the URL
      // 2- the expiry should not have passed
      
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
        //TODO run an async update call to clear out the shareExpiry and sharedId since the duration time has expired
        next(new Error("This share has expired"));
      }
      
      
      const userId = rootFolder.authorId;
      const files = await getFiles(userId, rootFolder.id)
      
      console.log('in getFileExplorer - retrieved files: ', files)
      const folders = await getFolders(userId, rootFolder.id)
      console.log('in getFileExplorer - retrieved folders: ', folders)
      console.log('root folder: ', rootFolder)
      
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
        rootFolder.id
      );
      
      const viewVariables = {
        userId,
        rootFolder,
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