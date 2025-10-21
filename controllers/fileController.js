const { body, param, validationResult } = require('express-validator')

const {
  msToDays,
  basicFolderIdCheck,
  getPathsForDisplay,
  basicFileIdCheck,
  getFileDetails,
} = require("../utils/utils");

const fs = require("fs");

require('dotenv').config()
const cloudinary = require('cloudinary').v2
const CustomNotFoundError = require('../errors/CustomNotFoundError')
const ValidationError = require("../errors/ValidationError")

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
  shareFolder: dbShareFolder,
  deleteFolder: dbDeleteFolder,
  updateFolder: dbUpdateFolder
} = require('../db/fileQueries')


const multer = require('multer')
const { file, folder } = require('../middleware/prisma')

const storage = multer.memoryStorage()
/*
multer.diskStorage({
storage: (req, file, cb) => {
  cb(null, 'uploads/')
},
filename: (req, file, cb) => {
  cb(null, file.originalname)
}
}) */

const upload = multer({
  storage,
  limits: {
    fileSize: 52428800, // 50 * 1024 * 1024
    files: 1
  }
})

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

const deleteFile = [
  basicFileIdCheck(param("fileId")),
  async (req, res, next) => {
    console.log("in deleteFile");
    if (req.isAuthenticated()) {
      const user = res.locals.currentUser;
      const file = await getFileById(req.params.id);
      if (file.authorId === user.id) {
        try {
          // unlinkSync(`${file.location}`)
          
          console.log(`${file.location}/${file.name} was deleted`);
          const delfile = await deleteFileById(user.id, req.params.id);
          
          // the location field has the cloudinary file's folder and publicid in it
          const result = await cloudinary.uploader.destroy(delfile.publicId, {
            resource_type: delfile.resource_type,
            type: "authenticated",
          });
          console.log("result from destroy file: ",result);
          res.redirect("/file/explorer/" + delfile.parentId);
        } catch (err) {
          if (delfile) {
            // recreate the record of the file
            const file = await createFile(
              user.id,
              delfile.parentId,
              delfile.name,
              delfile.size,
              delfile.publicId,
              delfile.resource_type,
              delfile.url,
              delfile.pathArr
            );
            
          }
          next(err);
        }
      } else {
        next({ msg: "Improper permissions to delete this file: " + file.name });
      }
    }
  },
];

const shareFile = [
  async (req,res,next) =>  {
    const getTemporaryUrl = (publicId, expiresInSeconds = 3600) => {
      const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
      
      const url = cloudinary.url(file.publicId, {
        type: 'authenticated',       
        resource_type: file.resource_type,     
        sign_url: true,              // enables signature
        expires_at: timestamp        // sets expiration time
      });
      
      return url;
    };
  }
]

const uploadFile = [
  (req, res, next) => {
    upload.single('upload')(req, res, function (err) {
      console.log('should have uploaded unless there was an error?')
      if (err instanceof multer.MulterError) {
        // A Multer error occurred (e.g., file size limit exceeded)
        console.log('Multer error: ', err.message)
        // return res.status(400).send({ message: err.message, code: err.code })
        req.params.folderId = req.body.folderId
        req.errors = [{ msg: err.message }, { msg: 'Note that 10MB is max size for non video fies and 50MB is the max for videos.' }]
        return getFileExplorer(req, res)
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
    if (!errors.isEmpty() || req.errors) {
      return getFileExplorer(req, res)
    } else {
      next()
    }
  },
  async (req, res, next) => {
    if (req.errors) {
      next()
    }
    console.log('in uploadFile: ', req.file, req.body)
    if (!req.file) {
      req.errors = [{ msg: 'Review Logs: No file uploaded.' }]
      return getFileExplorer(req, res)
    } else {
      console.log('file mimetype: ', req.file.mimetype)
      
      if (req.file.mimetype.startsWith('video')) {
        if (req.file.size > 52428800) {
          throw new Error('Video files should not exceed 50MB.')
        }
      } else {
        if (req.file.size > 10 * 1024 * 1024) {
          throw new Error('Non-video files should not exceed 10MB.')
        }
      }
    }
    const { folderId } = req.body
    const { originalname, size } = req.file
    const user = res.locals.currentUser
    
    console.log('file details from multer: ', req.file)
    
    const options = {
      use_filename: true,
      overwrite: true,
      sign_url: true,
      unique_filename: true,
      resource_type: 'auto',
      type: 'authenticated',
      folder: 'TOP-file-uploader-app'
    }
    
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
        .upload_stream(options, (error, uploadResult) => {
          if (error) {
            return reject(error)
          }
          return resolve(uploadResult)
        })
        .end(req.file.buffer)
      })
      
      console.log('uploadResult: ', uploadResult)
      const file = await createFile(user.id, folderId, originalname, size, uploadResult.public_id, uploadResult.resource_type,
        uploadResult.secure_url,
        [
          ...req.parentFolder.pathArr,
          folderId
        ])
        
        res.redirect('/file/explorer/' + file.parentId)
      } catch (error) {
        console.log('in uploadFile: found an error during upload?')
        if (uploadResult) {
          // clean up the file from cloudinary since we failed to store a record of it in postgresql
          const result = await cloudinary.uploader.destroy(
            uploadResult.publicId, {
              resource_type: uploadResult.resource_type,
              type: "authenticated",
            });
          }
          console.error(error)
          next(error)
        }
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
        
        const folder = await getFolder(req.body.authorId, req.body.folderId);
        const existingFolder = await getUniqueFolder(
          value,
          folder.parentId,
          req.body.authorId
        )
        if (existingFolder) {
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
          return getFileExplorer(req, res) // the current user should not be modifying someone else's files
        } else {
          const errors = validationResult(req)
          
          console.log('ERRORS? ', errors)
          if (!errors.isEmpty()) {
            // req.errors = errors.array();
            return getFileExplorer(req, res)
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
          return getFileExplorer(req, res)
        } else {
          const paths = await getPathsForDisplay(user.id, 
            req.body["root-folder"],
          );
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
          return getFileExplorer(req, res)
        } else if (folder.name === '/') {
          req.errors = [{ msg: 'Cannot delete the root path.' }]
          return getFileExplorer(req, res)
        } else {
          console.log('Try to delete the folder: ', req.params.id)
          const deletedFolder = await dbDeleteFolder(user.id, req.params.id)
          res.redirect('/file/explorer/' + deletedFolder.parentId)
        }
      } else {
        res.redirect('/')
      }
    }
    
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
        console.log('file-explorer ERRORS? ', errors)
        
        const paths = await getPathsForDisplay(
          user.id,
          rootFolder.id
        );
        
        // setup daysToExpire from shareExpiry ms value
        
        const remMS = BigInt(rootFolder.shareExpiry) - BigInt(Date.now());
        const shareRem = msToDays(remMS);
        
        if (remMS > 0) {
          rootFolder.daysToExpire = rootFolder.shareExpiry
          ? `${shareRem.days} days, ${shareRem.hours} hours`
          : "0 days";
        } else {
          //TODO run an async update call to clear out the shareExpiry and sharedId since the duration time has expired
        }
        rootFolder.shared = remMS > 0;
        
        const viewVariables = {
          user,
          rootFolder,
          folders,
          files,
          isRootFolder,
          paths,
        };
        if (errors.length > 0) {
          res.render('file-explorer', { errors, ...viewVariables })
        } else {
          console.log(paths)
          res.render('file-explorer', viewVariables)
        }
      } else {
        res.status(404).redirect('/')
      }
    }
    
    const shareFolder = [
      basicFolderIdCheck(body('folderId')),
      body('share-duration')
      .trim().notEmpty()
      .withMessage("Share duration must be selected.")
      .isInt({ min: 0, max: 7 })
      .withMessage("Share duration must be a number 0-7."),
      async (req, res, next) => {
        if (req.isAuthenticated) {
          const user = res.locals.currentUser;
          // check if current user owns this folder or not
          console.log("req.body: ", req.body);
          const folder = await getFolder(user.id, req.body.folderId)
          if (!folder) {
            // this user is not allowed to share
            next({ msg: "Insufficient permissions to share this folder." });
          } else {
            console.log("do something to share it: ", folder);
            const sharedFolder = await dbShareFolder(
              user.id,
              folder.parentId,
              folder.id,
              req.body["share-duration"]
            );
            console.log(sharedFolder);
            
            const paths = await getPathsForDisplay(user.id, folder.id);
            
            // setup daysToExpire from shareExpiry ms value
            const remMS = BigInt(sharedFolder.shareExpiry) - BigInt(Date.now());
            const shareRem = msToDays(remMS)
            if (remMS > 0) {
              sharedFolder.daysToExpire = sharedFolder.shareExpiry
                ? `${shareRem.days} days, ${shareRem.hours} hours`
                : "0 days";
              sharedFolder.sharedURL = `${req.headers.origin}/shared/folder/${user.id}/${sharedFolder.id}/${sharedFolder.sharedId}`;
            } else {
              //TODO run an async update call to clear out the shareExpiry and sharedId since the duration time has expired
            }
            sharedFolder.shared = remMS > 0
            res.render("share-result", { user, folder: sharedFolder, paths });
          }
        } else {
          throw new ValidationError("Please sign in first.")
        }
      }
    ];
    
    const getShareFolder = [
      basicFolderIdCheck(param('folderId')),
      async (req, res, next) => {
        if (req.isAuthenticated) {
          const user = res.locals.currentUser;
          // check if current user owns this folder or not
          
          const folder = await getFolder(user.id, req.params.folderId)
          if (!folder) {
            // this user is not allowed to share
            next({ msg: "Insufficient permissions to share this folder." });
          } else {
            console.log("folder retrieved: ", folder);
            const paths = await getPathsForDisplay(
              user.id,
              folder.id
            );
            res.render('share', { user, folder, paths })
          }
        } else {
          throw new ValidationError("Insufficient permissions to share this folder")
        }
      }
    ];
    
    module.exports = {
      getFileExplorer,
      getFileDetails,
      createNewFolder,
      deleteFolder,
      updateFolder,
      uploadFile,
      deleteFile,
      getShareFolder,
      shareFolder
    }
    