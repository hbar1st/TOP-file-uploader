const prisma = require("../middleware/prisma");

/*
async function addFile() {
  console.log("in addFile: "),
    const newFile = await prisma.file.create({
      data: {
        createdAt: Date.now(),
        name,
        location: "no idea",
        size: 0,
        authorId,
        parentId
      }
    })
}
    */

async function createRootFolder(authorId) {
  console.log("in createRootFolder: ");
  const newFolder = await prisma.folder.create({
    data: {
      createdAt: new Date(),
      name: "/",
      authorId,
    },
  });
  return newFolder;
}

async function hasRootFolder(authorId, rootId) {
  console.log("in hasRootFolder: ", authorId);
  const rootFolder = await prisma.folder.findUnique({
    where: {
      authorId,
      id: rootId
    }
  });
  return rootFolder;
}
/*
async function addFolder(name) {
  console.log("in addFolder: ", name);
  const newFolder = await prisma.folder.create({
    data: {
      createdAt: new Date(),
      name,
      authorId,
    }
  })
}
*/
function getRootFiles(authorId, parentId) {
  console.log("in getRootFiles: ", authorId, parentId);
  const files = prisma.file.findMany({
    where: {
      parentId,
    },
  });
  return files;
}

function getRootFolders(authorId, parentId) {
  console.log("in getRootFolders: ", authorId, parentId);
  const folders = prisma.folder.findMany({
    where: {
      authorId,
      parentId,
    },
  });
  return folders;
}
module.exports = {
  createRootFolder,
  getRootFiles,
  getRootFolders,
  hasRootFolder,
};