const { body, param, validationResult } = require('express-validator')
require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const CustomNotFoundError = require('../errors/CustomNotFoundError')
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
  getUniqueFile,
  getFileById,
  deleteFileById,
  deleteFolder: dbDeleteFolder,
  updateFolder: dbUpdateFolder
} = require('../db/fileQueries')

// const { user } = require("../middleware/prisma");

// Return "https" URLs by setting secure: true
async function setupCloud() {
  await cloudinary.config({
    secure: true
  });
  
  // Log the configuration
  console.log(cloudinary.config());

  const result = await cloudinary.api
    .create_upload_preset({
      name: "file_preset",
      sign_url: true,
      use_filename: true,
      unique_filename: true,
      resource_type: "auto",
      overwrite: false,
      type: "authenticated",
      asset_folder: "TOP-file-uploader-app",
    })
    console.log(result);
}

const multer = require('multer')
const storage = multer.diskStorage({
  storage: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  limits: {
    fileSize: 52428800, // 50 * 1024 * 1024 
    files: 1
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('video')) {
      if (file.size > 52428800) {
        return cb(new Error("Video files should not exceed 50MB."));
      }
    } else {
      if (file.size > (10 * 1024 * 1024)) {
        return cb(new Error('Non-video files should not exceed 10MB.'))
      }
    }
    cb(null, true)
  }
})

const upload = multer({ storage })

function basicFileIdCheck (value) {
  return value.trim().notEmpty().withMessage('A file id must be provided.')
  .isInt({ min: 1 }).withMessage('The file id must be a number.')
}

function basicAuthorIdCheck (value) {
  return (
    value
    .trim()
    .notEmpty()
    .withMessage('An author id must be provided.')
    .isInt({ min: 1 })
    .withMessage('The author id must be a number.')
  )
}

function basicFolderIdCheck (value) {
  return (
    value
    .trim()
    .notEmpty()
    .withMessage('The folder id must be provided.')
    .isInt({ min: 1 })
    .withMessage('The folder id must be a number.')
  )
}

const validateFile = [
  // check if the root folder exists for this specific user first
  basicAuthorIdCheck(body('authorId')).customSanitizer((value) => Number(value)),
  basicFolderIdCheck(body('folderId'))
  .customSanitizer((value) => Number(value))
  .custom(async (value, { req }) => {
    const folder = await getFolder(req.body.authorId, req.body.folderId)
    if (!folder) {
      throw new Error("You don't have permission to upload to this folder.")
    } else {
      req.parentFolder = folder
    }
  })
]

const { unlinkSync } = require("fs")

const deleteFile = [
  
  async (req, res, next) => {
    console.log('in deleteFile')
    // Assuming that 'path/file.txt' is a regular file.
    if (req.isAuthenticated()) {
      const user = res.locals.currentUser
      const file = await getFileById(req.params.id)
      if (file.authorId === user.id) {
        try {
          unlinkSync(`${file.location}`)
          
          console.log(`${file.location}/${file.name} was deleted`)
          const delfile = await deleteFileById(user.id,req.params.id)
          
          res.redirect("/file/explorer/" + delfile.parentId);
        } catch (err) {
          next(err)
        }
      } else {
        req.errors = [{ msg: 'Improper permissions to delete this file: ' + file.name }]
      }
      
    }
  }
]

const uploadFile = [
  (req, res, next) => {
    upload.single('upload')(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred (e.g., file size limit exceeded)
        console.log(err.message);
        //return res.status(400).send({ message: err.message, code: err.code })
        next(err);
      } else if (err) {
        // An unknown error occurred
        return res.status(500).send({ message: 'An unknown error occurred.' })
      }
      next()
    })
  },
  validateFile,
  (req, res, next) => {
    const errors = validationResult(req)
    
    console.log('ERRORS? ', errors)
    if (!errors.isEmpty()) {
      getFileExplorer(req, res)
    } else {
      next()
    }
  },
  async (req, res) => {
    console.log('in uploadFile: ', req.file, req.body)
    if (!req.file) {
      return res.status(400).send('Review Logs: No file uploaded.')
    } else {
      console.log('file: ', req.file.mimetype)
    }
    const { folderId } = req.body
    const { originalname, size, path } = req.file
    const user = res.locals.currentUser
    

    const uploadFile = async (filePath) => {
      // Use the uploaded file's name as the asset's public ID and
      // allow overwriting the asset with new versions
      const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        upload_preset: "file_preset",
      };

      try {
        // Upload the image
        const result = await cloudinary.v2.uploader.upload(filePath, options);
        console.log(result);
        return result.secure_url;
      } catch (error) {
        console.error(error);
      }
    };
    const url = uploadFile(path);
    
    const file = await createFile(user.id, folderId, originalname, size, url, [
      ...req.parentFolder.pathArr,
      folderId,
    ]);
    res.redirect('/file/explorer/' + file.parentId)
  }
]

const validateFolder = [
  basicAuthorIdCheck(body('authorId')).customSanitizer((value) => Number(value)),
  body('root-folder')
  .trim()
  .notEmpty()
  .withMessage(
    'Base folder is undefined. Cannot create a folder with no parent.'
  )
  .isInt({ min: 1 })
  .withMessage('The folder id must be a number.')
  .customSanitizer((value) => Number(value))
  .custom(async (value, { req }) => {
    // check if the root folder's id exists
    console.log('check if the root folder exists: ', value)
    const folder = await getFolder(req.body.authorId, value)
    if (!folder) {
      throw new Error("Base folder id doesn't exist. DB may be corrupted.")
    }
  }),
  body('new-folder')
  .trim()
  .notEmpty()
  .withMessage('Cannot create a folder with no name.')
  .isLength({
    max: 255
  })
  .withMessage('The folder name length must not exceed 255 characters.')
  .custom(async (value, { req }) => {
    console.log('check if this is a unique name in the current path')
    const folder = await getUniqueFolder(
      value,
      req.body['root-folder'],
      req.body.authorId
    )
    console.log('in validation process - retrieved folder: ', folder)
    if (folder) {
      throw new Error(`This folder name, "${value}", already exists.`)
    }
  })
]

const validateFolderB4Update = [
  basicAuthorIdCheck(body('authorId')).customSanitizer((value) => Number(value)),
  basicFolderIdCheck(body('folderId')).customSanitizer((value) => Number(value)),
  body('folder-name')
  .trim()
  .notEmpty()
  .withMessage('Cannot create a folder with no name.')
  .isLength({
    max: 255
  })
  .withMessage('The folder name length must not exceed 255 characters.')
  .custom(async (value, { req }) => {
    // check if this is a unique name in the current path
    const folder = await getUniqueFolder(
      value,
      req.body.folderId,
      req.body.authorId
    )
    if (folder) {
      throw new Error(`This folder name, "${value}", already exists.`)
    }
  })
]

const updateFolder = [
  validateFolderB4Update,
  async (req, res) => {
    console.log('updateFolder: ', req.body['folder-name'])
    
    const user = res.locals.currentUser
    
    if (user.id !== req.body.authorId) {
      req.errors = [
        {
          msg: 'Cannot update a folder that is not owned by the current user.'
        }
      ]
      getFileExplorer(req, res) // the current user should not be modifying someone else's files
    } else {
      const errors = validationResult(req)
      
      console.log('ERRORS? ', errors)
      if (!errors.isEmpty()) {
        // req.errors = errors.array();
        getFileExplorer(req, res)
      } else {
        const folder = await dbUpdateFolder(
          user.id,
          req.body.parentId,
          req.body.folderId,
          req.body['folder-name']
        )
        res.redirect('/file/explorer/' + folder.id)
      }
    }
  }
]

const createNewFolder = [
  validateFolder,
  async (req, res) => {
    console.log('in createNewFolder: ', req.body['root-folder'])
    
    const user = res.locals.currentUser
    if (user.id !== Number(req.body.authorId)) {
      res.redirect('/') // the current user should not be modifying someone else's files
    }
    
    const errors = validationResult(req)
    
    console.log('ERRORS? ', errors)
    if (!errors.isEmpty()) {
      getFileExplorer(req, res)
    } else {
      const paths = await getFolderPath(user.id, [req.body['root-folder']])
      console.log('paths retrieved: ', paths)
      const pathArr = paths.map(val => val.id)
      
      await createFolder(user.id, req.body['root-folder'], req.body['new-folder'], pathArr)
      res.redirect('/file/explorer/' + req.body['root-folder'])
    }
  }
]

async function deleteFolder (req, res) {
  const user = res.locals.currentUser
  if (req.isAuthenticated()) {
    // check if folder is root. If it is, that's an error
    const folder = getFolder(user.id, req.params.id)
    if (!folder) {
      req.errors = [{ msg: "Failed to delete this folder as it doesn't exist." }]
      getFileExplorer(req, res)
    } else if (folder.name === '/') {
      req.errors = [{ msg: 'Cannot delete the root path.' }]
      getFileExplorer(req, res)
    } else {
      console.log('Try to delete the folder: ', req.params.id)
      const deletedFolder = await dbDeleteFolder(user.id, req.params.id)
      res.redirect('/file/explorer/' + deletedFolder.parentId)
    }
  } else {
    res.redirect('/')
  }
}

const getFileDetails = [
  basicFolderIdCheck(param('folderId')),
  basicFileIdCheck(param('fileId')),
  async function (req, res, next) {
    console.log('in getFileDetails: ', req.params)
    if (req.isAuthenticated()) {
      const user = res.locals.currentUser
      const parentId = req.params.folderId
      const fileId = req.params.fileId
      
      // check if the file belongs to the folder provided and the user.id
      const file = await getUniqueFile(user.id, parentId, fileId)
      
      if (!file) {
        req.errors = [
          { msg: "The file doesn't exist." }
        ]
        res.status(400)
        next()
      } else {
        const paths = await getFolderPath(user.id, [
          parentId
        ])
        console.log('paths retrieved: ', paths)
        paths.push({ id: fileId, name: file.name })
        // const pathArr = paths.map((val) => val.id)
        console.log('render the file details: ', file)
        res.render('file', { file, user, paths })
      }
    }
  }
]

async function getFileExplorer (req, res) {
  if (req.isAuthenticated()) {
    console.log('in getFileExplorer: ', res.locals.currentUser)
    
    const user = res.locals.currentUser
    let rootFolder = await hasRootFolder(user.id)
    
    if (!rootFolder) {
      rootFolder = await createRootFolder(user.id)
    }
    
    if (req.params.folderId && (req.params.folderId !== rootFolder.id)) {
      console.log('this is not the root folder that we are about to display')
      rootFolder = await getFolder(user.id, req.params.folderId)
      if (!rootFolder) {
        throw new CustomNotFoundError('The folder cannot be found.')
      }
    }
    console.log('rootFolder row: ', rootFolder)
    const files = await getFiles(user.id, rootFolder.id)
    
    console.log('in getFileExplorer - retrieved files: ', files)
    const folders = await getFolders(user.id, rootFolder.id)
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
    console.log('ERRORS? ', errors)
    
    const paths = await getFolderPath(user.id, [rootFolder.id])
    if (errors.length > 0) {
      res.render('file-explorer', { user, rootFolder, folders, files, isRootFolder, errors, paths })
    } else {
      console.log(paths)
      res.render('file-explorer', { user, rootFolder, folders, files, isRootFolder, paths })
    }
  } else {
    res.status(404).redirect('/')
  }
}

module.exports = {
  setupCloud,
  getFileExplorer,
  getFileDetails,
  createNewFolder,
  deleteFolder,
  updateFolder,
  uploadFile,
  deleteFile
}
