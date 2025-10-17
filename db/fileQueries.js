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
authorId: Number(authorId),
parentId: Number(parentId)
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

async function hasRootFolder(authorId) {
  console.log("in hasRootFolder: ", authorId);
  const rootFolder = await prisma.folder.findUnique({
    where: {
      authorId,
      name: '/'
    }
  });
  return rootFolder;
}

async function createFolder(authorId, parentId, name, pathArr) {
  console.log("in createFolder: ", authorId, parentId, name, pathArr);
  
  const newFolder = await prisma.folder.create({
    data: {
      createdAt: new Date(),
      name,
      authorId: Number(authorId),
      parentId: Number(parentId),
      pathArr,
    }
  })
  return newFolder;
}

function getFiles(authorId, parentId) {
  console.log("in getFiles: ", authorId, parentId);
  const files = prisma.file.findMany({
    where: {
      parentId,
    },
  });
  return files;
}

function getFolders(authorId, parentId) {
  console.log("in getFolders: ", authorId, parentId);
  const folders = prisma.folder.findMany({
    where: {
      authorId,
      parentId,
    },
  });
  return folders;
}

function getFolder(id) {
  console.log("in getFolder: ", id);
  const folder = prisma.folder.findUnique({
    where: {
      id: Number(id)
    }
  })
  return folder;
}

function deleteFolder(id) {
  console.log("in deleteFolder: ", id);
  prisma.folder.delete({
    where: {
      id
    }
  })
}

async function getFolderPath(authorId, folderIds, path=[]) {
  console.log("--------->>>>> in getFolderPath: ", authorId, folderIds, path);
  if (!folderIds || folderIds.length === 0) {
    return path ?? [];
  }
  const currFolderId = folderIds.pop();
  const folder = await prisma.folder.findUnique({
    where: {
      id: Number(currFolderId),
    },
    select: {
      id: true,
      pathArr: true,
      name: true,
    },
  });
  if (!folder) {
    throw new Error("folder in getFolderPath query should not be null");
  }
  console.log("folder found: " ,folder);
  path.unshift({ id: folder.id, name: folder.name });
  console.log("path: ", path);
  if (folder.pathArr && folder.pathArr.length > 0) {
    folderIds = Array.from(new Set([...folderIds, ...folder.pathArr]));    
  }
  return getFolderPath(authorId, folderIds, path);
}

module.exports = {
  createRootFolder,
  getFiles,
  getFolders,
  hasRootFolder,
  getFolder,
  createFolder,
  getFolderPath,
  deleteFolder
};