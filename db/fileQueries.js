const { Prisma } = require("@prisma/client");
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
      authorId: Number(authorId),
    },
  });
  return newFolder;
}

async function hasRootFolder(authorId) {
  console.log("in hasRootFolder: ", authorId);
  const rootFolder = await prisma.folder.findFirst({
    where: {
      name: "/",
      authorId: Number(authorId),
      parentId: null,
    },
  });
  return rootFolder;
}

function createFile(authorId, parentId, name, size, location) {
  console.log("in createFile: ", authorId, parentId, name, size, location);

  const file = prisma.file.create({
    data: {
      createdAt: new Date(),
      authorId: Number(authorId),
      parentId: Number(parentId),
      pathArr: [Number(parentId)],
      size,
      location,
      name
    }
  });
  return file;
}

function createFolder(authorId, parentId, name, pathArr) {
  console.log("in createFolder: ", authorId, parentId, name, pathArr);
  
  const newFolder = prisma.folder.create({
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

function updateFolder(authorId, parentId, folderId, newName) {
  console.log("in updateFolder: ", authorId, parentId, folderId, newName);
  const folder = prisma.folder.update({
    where: {
      authorId: Number(authorId),
      parentId: Number(parentId),
      id: Number(folderId)
    },
    data: {
      name: newName
    }
  });
  return folder;
}

function getFiles(authorId, parentId) {
  console.log("in getFiles: ", authorId, parentId);
  const files = prisma.file.findMany({
    where: {
      parentId: Number(parentId),
      authorId: Number(authorId)
    },
  });
  return files;
}

function getFolders(authorId, parentId) {
  console.log("in getFolders: ", authorId, parentId);
  const folders = prisma.folder.findMany({
    where: {
      authorId: Number(authorId),
      parentId: Number(parentId),
    },
  });
  return folders;
}

function getFolder(authorId, id) {
  console.log("in getFolder: ", authorId, id);
  const folder = prisma.folder.findUnique({
    where: {
      id: Number(id),
      authorId: Number(authorId)
    }
  })
  return folder;
}

function deleteFolder(authorId, id) {
  console.log("in deleteFolder: ", authorId, id);
  const deletedFolder = prisma.folder.delete({
    where: {
      id: Number(id),
      authorId: Number(authorId)
    }
  })
  return deletedFolder;
}

function getUniqueFolder(name, parentId, authorId) {
  console.log("in getUniqueFolder: ", name, parentId, authorId);
  const folder = prisma.folder.findUnique({
    where: {
      authorId_name_parentId: {
        authorId: Number(authorId),
        name,
        parentId: Number(parentId),
      },
    },
  });
  return folder;
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
  createFile,
  getFolderPath,
  deleteFolder,
  getUniqueFolder,
  updateFolder
};