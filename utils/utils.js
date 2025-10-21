const { loadESLint } = require("eslint");

const {
  getFolderPath,
  getUniqueFile
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


const getFileDetails = [
  basicFolderIdCheck(param("folderId")),
  basicFileIdCheck(param("fileId")),
  async function (req, res, next) {
    console.log("in getFileDetails: ", req.params);
    let user = {};
    if (req.params.sharedId) {
      user = { id: req.params.userId } // make a fake user when we're coming here from a shared path
    } else {
      user = res.locals.currentUser;
    }
    
    const parentId = req.params.folderId;
    const fileId = req.params.fileId;
    
    // check if the file belongs to the folder provided and the user.id
    const file = await getUniqueFile(user.id, parentId, fileId);
    
    if (!file) {
      req.errors = [{ msg: "The file doesn't exist." }];
      next();
    } else {
      // setup daysToExpire from shareExpiry ms value
      
      const remMS = BigInt(file.shareExpiry) - BigInt(Date.now());
      const shareRem = msToDays(remMS);
      
      if (remMS > 0) {
        file.daysToExpire = file.shareExpiry
        ? `${shareRem.days} days, ${shareRem.hours} hours`
        : "0 days";
      } else {
        //TODO run an async update call to clear out the shareExpiry and sharedId since the duration time has expired
      }
      file.shared = remMS > 0;
      const paths = await getPathsForDisplay(user.id, parentId, req.params.sharedId ?? 0);
      paths.push({ id: fileId, name: file.name });
      const view = req.params.sharedId ? 'public-file' : 'file'
      res.render(view, { file, user, paths, sharedId: req.params.sharedId, folderId: file.parentId });
    }
  }
];


module.exports = {
  msToDays,
  basicFolderIdCheck,
  getPathsForDisplay,
  basicFileIdCheck,
  getFileDetails,
};
