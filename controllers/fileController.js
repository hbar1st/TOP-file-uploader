const { body, validationResult } = require("express-validator");
const CustomNotFoundError = require("../errors/CustomNotFoundError")
const {
  getFiles,
  createRootFolder,
  getFolders,
  hasRootFolder,
  getFolder,
  createFolder,
  getFolderPath,
  deleteFolder: dbDeleteFolder,
} = require("../db/fileQueries");


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
    console.log("in createNewFolder: ", req.body["root-folder"]);
    const user = res.locals.currentUser;
    
    const errors = validationResult(req);
    
    console.log("ERRORS? ", errors);
    if (!errors.isEmpty()) {
      req.errors = errors;
      getFileExplorer(req, res);
    } else {
      const paths = await getFolderPath(user.id, [req.body["root-folder"]]);
      console.log("paths retrieved: ", paths);
      const pathArr = paths.map(val => val.id);
      
      await createFolder(user.id, req.body["root-folder"], req.body["new-folder"], pathArr);
      res.redirect("/file/explorer/" + req.body["root-folder"]);
    }
  }
]


async function deleteFolder(req, res) {
  if (req.isAuthenticated()) {
    // check if folder is root. If it is, that's an error
    const folder = getFolder(req.params.id);
    if (!folder) {
      req.errors = [{ msg: "Failed to delete this folder as it doesn't exist." }];
      getFileExplorer(req, res);
    } else if (folder.name === '/') {
      req.errors = [{ msg: "Cannot delete the root path. " }];
      getFileExplorer(req, res);
    } else {
      await dbDeleteFolder(req.params.id);
      res.redirect("/file/explorer");
    }
  }
}

async function getFileExplorer(req, res) {
  if (req.isAuthenticated()) {
    console.log("in getFileExplorer: ", res.locals.currentUser);
    
    const user = res.locals.currentUser;
    let rootFolder = await hasRootFolder(user.id);
    
    if (!rootFolder) {
      rootFolder = await createRootFolder(user.id);
    }
    
    if (req.params.folderId && (req.params.folderId !== rootFolder.id)) {
      console.log("this is not the root folder that we are about to display")
      rootFolder = await getFolder(req.params.folderId);
      if (!rootFolder) {
        throw new CustomNotFoundError("The folder cannot be found.");
      }
    }
    console.log("rootFolder row: ", rootFolder);
    let files = await getFiles(user.id, rootFolder.id);
    
    console.log("retrieved files: ", files);
    let folders = await getFolders(user.id, rootFolder.id);
    console.log("retrieved folders: ", folders);
    console.log("root folder: ", rootFolder);
    
    let isRootFolder = false;
    if (rootFolder.name === '/') {
      isRootFolder = true;
    }
    const errors = validationResult(req);
    if (req.errors) {
      errors = [...errors, ...req.errors];
    }
    console.log("ERRORS? ", errors);

    if (!errors.isEmpty()) {
      
      res.render("file-explorer", { user, rootFolder, folders, files, isRootFolder, errors });
    } else {
      
      const paths = await getFolderPath(user.id, [rootFolder.id]);
      console.log(paths);
      res.render("file-explorer", { user, rootFolder, folders, files, isRootFolder, paths });
    }
  } else {
    res.status(404).redirect("/");
  }
}


module.exports = {
  getFileExplorer,
  createNewFolder,
  deleteFolder,
};