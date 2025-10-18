const { body, validationResult } = require("express-validator");
const CustomNotFoundError = require("../errors/CustomNotFoundError")
const {
  getFiles,
  createRootFolder,
  getFolders,
  hasRootFolder,
  getFolder,
  createFolder,
  createFile,
  getFolderPath,
  getUniqueFolder,
  deleteFolder: dbDeleteFolder,
  updateFolder: dbUpdateFolder,
} = require("../db/fileQueries");


const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

const basicAuthorIdCheck = () =>
  body("authorId")
.trim()
.notEmpty()
.withMessage("An author id must be provided.")
.isInt({ min: 1 })
.withMessage("The author id must be a number.")

const basicFolderIdCheck = () =>
  body("folderId")
.trim()
.notEmpty()
.withMessage("The folder id must be provided.")
.isInt({ min: 1 })
.withMessage("The folder id must be a number.");


const validateFile = [
  //check if the root folder exists for this specific user first
  basicAuthorIdCheck().customSanitizer((value) => Number(value)),
  basicFolderIdCheck()
    .customSanitizer((value) => Number(value))
    .custom(async (value, { req }) => {
      const folder = await getFolder(req.body.authorId, req.body.folderId);
      if (!folder) {
        throw new Error("You don't have permission to upload to this folder.");
      }
    }),
];


const uploadFile = [
  validateFile,
  (req, res, next) => {
    const errors = validationResult(req);

    console.log("ERRORS? ", errors);
    if (!errors.isEmpty()) {
      getFileExplorer(req, res);
    }
    next();
  },
  upload.single("upload"),
  async (req, res) => {
    console.log("in uploadFile: ", req.file, req.body);
    const { folderId, authorId } = req.body;
    const { originalname, size, path } = req.file;
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    const file = await createFile(authorId, folderId, originalname, size, path);
    res.redirect("/file/explorer/" + folderId);
  },
];

validateFolder = [
  basicFolderIdCheck().customSanitizer((value) => Number(value)),
  body("root-folder")
  .trim()
  .notEmpty()
  .withMessage(
    "Base folder is undefined. Cannot create a folder with no parent."
  )
  .isInt({ min: 1 })
  .withMessage("The folder id must be a number.")
  .customSanitizer((value) => Number(value))
  .custom(async (value, { req }) => {
    // check if the root folder's id exists
    console.log("check if the root folder exists: ", value);
    const folder = await getFolder(req.body.authorId, value);
    if (!folder) {
      throw new Error("Base folder id doesn't exist. DB may be corrupted.");
    }
  }),
  body("new-folder")
  .trim()
  .notEmpty()
  .withMessage("Cannot create a folder with no name.")
  .isLength({
    max: 255,
  })
  .withMessage("The folder name length must not exceed 255 characters.")
  .custom(async (value, { req }) => {
    console.log("check if this is a unique name in the current path");
    const folder = await getUniqueFolder(
      value,
      req.body["root-folder"],
      req.body.authorId
    );
    console.log("in validation process - retrieved folder: ", folder);
    if (folder) {
      throw new Error(`This folder name, "${value}", already exists.`);
    }
  }),
];

validateFolderB4Update = [
  basicAuthorIdCheck().customSanitizer((value) => Number(value)),
  basicFolderIdCheck().customSanitizer((value) => Number(value)),
  body("folder-name")
  .trim()
  .notEmpty()
  .withMessage("Cannot create a folder with no name.")
  .isLength({
    max: 255,
  })
  .withMessage("The folder name length must not exceed 255 characters.")
  .custom(async (value, { req }) => {
    //check if this is a unique name in the current path
    const folder = await getUniqueFolder(
      value,
      req.body.folderId,
      req.body.authorId
    );
    if (folder) {
      throw new Error(`This folder name, "${value}", already exists.`);
    }
  }),
];

updateFolder = [
  validateFolderB4Update,
  async (req, res) => {
    console.log("updateFolder: ", req.body["folder-name"]);
    
    const user = res.locals.currentUser;
    
    if (user.id !== req.body.authorId) {
      req.errors = [
        {
          msg: "Cannot update a folder that is not owned by the current user.",
        },
      ];
      getFileExplorer(req, res); // the current user should not be modifying someone else's files
    } else {
      const errors = validationResult(req);
      
      console.log("ERRORS? ", errors);
      if (!errors.isEmpty()) {
        //req.errors = errors.array();
        getFileExplorer(req, res);
      } else {
        const folder = await dbUpdateFolder(
          user.id,
          req.body.parentId,
          req.body.folderId,
          req.body["folder-name"]
        );
        res.redirect("/file/explorer/" + folder.id);
      }
    }
  },
];

createNewFolder = [
  validateFolder,
  async (req, res) => {
    console.log("in createNewFolder: ", req.body["root-folder"]);
    
    
    const user = res.locals.currentUser;
    if (user.id !== Number(req.body.authorId)) {
      res.redirect("/"); // the current user should not be modifying someone else's files
    }
    
    const errors = validationResult(req);
    
    console.log("ERRORS? ", errors);
    if (!errors.isEmpty()) {
      //req.errors = errors.array();
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
  const user = res.locals.currentUser;
  if (req.isAuthenticated()) {
    // check if folder is root. If it is, that's an error
    const folder = getFolder(user.id, req.params.id);
    if (!folder) {
      req.errors = [{ msg: "Failed to delete this folder as it doesn't exist." }];
      getFileExplorer(req, res);
    } else if (folder.name === '/') {
      req.errors = [{ msg: "Cannot delete the root path." }];
      getFileExplorer(req, res);
    } else {
      console.log("Try to delete the folder: ", req.params.id);
      const deletedFolder = await dbDeleteFolder(user.id, req.params.id);
      res.redirect("/file/explorer/"+deletedFolder.parentId);
    }
  } else {
    res.redirect("/");
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
      rootFolder = await getFolder(user.id, req.params.folderId);
      if (!rootFolder) {
        throw new CustomNotFoundError("The folder cannot be found.");
      }
    }
    console.log("rootFolder row: ", rootFolder);
    let files = await getFiles(user.id, rootFolder.id);
    
    console.log("in getFileExplorere - retrieved files: ", files);
    let folders = await getFolders(user.id, rootFolder.id);
    console.log("in getFileExplorer - retrieved folders: ", folders);
    console.log("root folder: ", rootFolder);
    
    let isRootFolder = false;
    if (rootFolder.name === '/') {
      isRootFolder = true;
    }
    let errors = validationResult(req);
    if (req.errors) {
      errors = [...errors.array(), ...req.errors];
    } else {
      errors = errors.array();
    }
    console.log("ERRORS? ", errors);
    
    const paths = await getFolderPath(user.id, [rootFolder.id]);
    if (errors.length > 0) {
      
      res.render("file-explorer", { user, rootFolder, folders, files, isRootFolder, errors, paths });
    } else {
      
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
  updateFolder,
  uploadFile,
};