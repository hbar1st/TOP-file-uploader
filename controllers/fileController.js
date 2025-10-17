const { body, validationResult } = require("express-validator");
const { getRootFiles, createRootFolder, getRootFolders, hasRootFolder } = require("../db/fileQueries");

async function createNewFolder(req, res) {
  console.log("in createNewFolder: ", req.params.parentId);
  const user = res.locals.currentUser;
  res.render("file-explorer", {user, rootFolder, folders, files, createFolder: true})
}
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
    res.render("file-explorer", { user, rootFolder, folders, files });
  } else {
    res.status(404).redirect("/");
  }
}

module.exports = {
  getFileExplorer,
  createNewFolder,
};