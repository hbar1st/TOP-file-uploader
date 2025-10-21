const {
  getFolderPath,
} = require("../db/fileQueries");

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

module.exports = {
  msToDays,
  basicFolderIdCheck,
  getPathsForDisplay,
};
