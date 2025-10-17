const { body, validationResult } = require("express-validator");
const { getRootFiles,
  createRootFolder,
  getRootFolders,
  hasRootFolder,
  getFolder,
  createFolder } = require("../db/fileQueries");
  const { folder } = require("../middleware/prisma");
  
  validateFolder = [
    body("root-folder")
    .trim()
    .notEmpty()
    .withMessage("Base folder is undefined. Cannot create a folder with no parent.")
    .custom(async (value, { req }) => {
      // check if the root folder's id exists
      console.log("check if the root folder exists: ", value)
      const folder = await getFolder(value);
      if (!folder) {
        throw new Error("Base folder id doesn't exist. DB may be corrupted.");
      }
    }),
    body("new-folder").trim().notEmpty().withMessage("Cannot create a folder with no name.")
    .isLength({
      max: 255
    })
    .withMessage("The folder name length must not exceed 255 characters.")
  ]
  createNewFolder = [
    validateFolder,
    async (req, res) => {
      console.log("in createNewFolder: ", req.params.parentId);
      const user = res.locals.currentUser;
      
      const errors = validationResult(req);
      
      console.log("ERRORS? ", errors);
      if (!errors.isEmpty()) {
        getFileExplorer(req, res);
      } else {
        await createFolder(user.id, req.body["root-folder"], req.body["new-folder"]);
        res.redirect("/file/explorer");
      }
    }
  ]
  async function getFileExplorer(req, res) {
    if (req.isAuthenticated()) {
      console.log("in getFileExplorer: ", res.locals.currentUser);
      
      const user = res.locals.currentUser;
      const rootFolder = await hasRootFolder(user.id, 1);
      
      if (!rootFolder) {
        await createRootFolder(user.id);
      }
      
      let files = await getRootFiles(user.id, 1);
      
      console.log("retrieved files: ", files);
      let folders = await getRootFolders(user.id, 1);
      console.log("retrieved folders: ", folders);
      console.log("root folder: ", rootFolder);
      
      const errors = validationResult(req);
      
      console.log("ERRORS? ", errors);
      if (!errors.isEmpty()) {
        
        res.render("file-explorer", { user, rootFolder, folders, files, errors });
      } else {
        res.render("file-explorer", { user, rootFolder, folders, files });
      }
    } else {
      res.status(404).redirect("/");
    }
  }
  
  module.exports = {
    getFileExplorer,
    createNewFolder,
  };