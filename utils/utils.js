const axios = require("axios");

const {
  getFileById,
  getFolderPath,
  getUniqueFile,
  findRootSharedFolder,
  removeShareSettings,
  removeFileShareSettings,
} = require("../db/fileQueries");

const { body, param, validationResult } = require("express-validator");

function msToDays(bigIntMS) {
  const ms = Number(bigIntMS);
  const totalDays = ms / (1000 * 60 * 60 * 24);
  const wholeDays = Math.floor(totalDays);
  const fractionalDay = totalDays - wholeDays;
  const hours = Math.floor(fractionalDay * 24);
  
  return { days: wholeDays, hours };
}

function basicFolderIdCheck(value) {
  return value
  .trim()
  .notEmpty()
  .withMessage("The folder id must be provided.")
  .isInt({ min: 1 })
  .withMessage("The folder id must be a number.");
}

async function getPathsForDisplay(userId, folderId, sharedId=0) {
  console.log("in getPathsForDisplay: ", userId, folderId, sharedId);
  const paths = await getFolderPath(userId, [Number(folderId)], sharedId);
  console.log("paths retrieved: ", paths);
  return paths;
}

function basicFileIdCheck(value) {
  return value
  .trim()
  .notEmpty()
  .withMessage("A file id must be provided.")
  .isInt({ min: 1 })
  .withMessage("The file id must be a number.");
}

function getUser(req, res) {
  let user = {}
  if (req.params.sharedId) {
    user = { id: req.params.userId }; // make a fake user when we're coming here from a shared path
  } else {
    user = res.locals.currentUser;
  }
  return user;
}
const getFileDetails = [
  basicFolderIdCheck(param("folderId")),
  basicFileIdCheck(param("fileId")),
  async function (req, res, next) {
    console.log("in getFileDetails: ", req.params);
    let user = getUser(req,res);
    
    const parentId = req.params.folderId;
    const fileId = req.params.fileId;
    
    // check if the file belongs to the folder provided and the user.id
    const file = await getUniqueFile(user.id, parentId, fileId);
    
    if (!file) {
      req.errors = [{ msg: "The file doesn't exist." }];
      next();
    } else {
      
      // setup the file's daysToExpire from shareExpiry ms value
      // note that this has nothing to do with whether we got here via a shared route or not!
      // this code must run so the display data for the file is correct
      
      let remMS = BigInt(file.shareExpiry) - BigInt(Date.now());
      const shareRem = msToDays(remMS);
      
      if (remMS > 0) {
        file.daysToExpire = file.shareExpiry
        ? `${shareRem.days} days, ${shareRem.hours} hours`
        : "0 days";
      } else {
        // run an async update call to clear out the shareExpiry and sharedId since the duration time has expired
        try {
          await removeFileShareSettings(file.id);
        } catch (error) {
          console.log(error);
        }
      }
      file.shared = remMS > 0;
      
      // the previous section was to update the actual file's share settings if any
      // this next section is to update any parent folder's shared settings if applicable
      
      // if current in a shared route, we need to confirm the share is active
      if (req.params.sharedId) {
        if (file.sharedId !== req.params.sharedId) {
          // if the sharedId then this file may be a descendant, but we need to make sure first
          const sharedFolder = await findRootSharedFolder(
            req.params.userId,
            req.params.sharedId,
            file.pathArr
          );
          console.log("found the root shared folder: ", sharedFolder);
          if (!sharedFolder) {
            next(new Error({ msg: "Invalid request" }));
          }
          //TODO since we came here on an unauthenticated route, we need to check if the shared file/folder path is still active or not
          // figure out if share has expired
          remMS = BigInt(sharedFolder.shareExpiry) - BigInt(Date.now());
          if (remMS < 0) {
            // if the expiry date has in fact passed, update the db and remove the sharedId and shareExpiry to blank/0 again
            // and show the user a 404 page?
            // run an async update call to clear out the shareExpiry and sharedId since the duration time has expired
            try {
              await removeShareSettings(sharedFolder.id);
            } catch (error) {
              console.log(error);
            }
            res.status(401);
            next(new Error({ msg: "This share has expired" }));
          }
        }
      }
      const paths = await getPathsForDisplay(user.id, parentId, req.params.sharedId ?? 0);
      paths.push({ id: fileId, name: file.name });
      const view = req.params.sharedId ? 'public-file' : 'file'
      res.render(view, { file, user, paths, sharedId: req.params.sharedId, folderId: file.parentId });
    }
  }
];


const downloadFile = [
  basicFileIdCheck(param("id")),
  async (req, res, next) => {
    console.log("in downloadFile");
    const user = getUser(req,res);
    const file = await getFileById(req.params.id);
    
    if (!file) {
      res.status(404);
      next(new Error({ msg: "Invalid request." }));
    }
    if (req.params.sharedId) {
      // check if the file is descending from a shared folder to match or not
      rootFolder = await findRootSharedFolder(
        req.params.userId,
        req.params.sharedId,
        file.pathArr
      );
      console.log("found the root shared folder: ", rootFolder);
      if (!rootFolder) {
        res.status(401);
        next(new Error({ msg: "Invalid request, the file has not been shared." }));
        return;
      }
      // if it does descend from a shared folder, then confirm the expiry date has not passed first
    }
    if (file.authorId === Number(user.id)) {
      try {
        // try to fetch the file from cloudinary?
        axios({
          method: "get",
          url: file.url,
          responseType: "stream",
        }).then(function (response) {
          console.log(`statusCode: ${response.status}`);
          console.log(response);
          // Set headers so browser treats it as a download
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=${file.name}`
          );
          res.setHeader("Content-Type", file.resource_type);
          res.setHeader("Content-Length", file.size);
          
          // Pipe the file stream into the response
          response.data.pipe(res);
        });
      } catch (error){
        next(error);
      }
    } else {
      console.log("author Id doesn't match user id: ", file.authorId, user.id);
      next({
        msg: "Improper permissions to download this file: " + file.name,
      });
    }
  }
];


module.exports = {
  msToDays,
  basicFolderIdCheck,
  getPathsForDisplay,
  basicFileIdCheck,
  getFileDetails,
  downloadFile,
};
