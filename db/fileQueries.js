// require('@prisma/client')
const prisma = require('../middleware/prisma')

const crypto = require("crypto")

async function createRootFolder (authorId) {
  console.log('in createRootFolder: ')
  const newFolder = await prisma.folder.create({
    data: {
      createdAt: new Date().toISOString(),
      name: '/',
      authorId: Number(authorId)
    }
  })
  return newFolder
}

async function hasRootFolder (authorId) {
  console.log('in hasRootFolder: ', authorId)
  const rootFolder = await prisma.folder.findFirst({
    where: {
      name: '/',
      authorId: Number(authorId),
      parentId: null
    }
  })
  return rootFolder
}

function createFile (
  authorId,
  parentId,
  name,
  size,
  publicId,
  resourceType,
  url,
  pathArr
) {
  console.log('in createFile: ', authorId, parentId, name, size, publicId, resourceType, url, pathArr)

  const file = prisma.file.create({
    data: {
      createdAt: new Date().toISOString(),
      authorId: Number(authorId),
      parentId: Number(parentId),
      pathArr,
      size,
      publicId,
      name,
      resource_type: resourceType,
      url
    }
  })
  return file
}

function createFolder (authorId, parentId, name, pathArr) {
  console.log('in createFolder: ', authorId, parentId, name, pathArr)

  const newFolder = prisma.folder.create({
    data: {
      createdAt: new Date().toISOString(),
      name,
      authorId: Number(authorId),
      parentId: Number(parentId),
      pathArr
    }
  })
  return newFolder
}

function shareFolder(authorId, parentId, folderId, shareDuration) {

  if (Number(shareDuration) === 0) {
    // unshare the folder in this case
    const folder = prisma.folder.update({
      where: {
        authorId: Number(authorId),
        parentId: parentId ? Number(parentId) : null,
        id: Number(folderId),
      },
      data: {
        sharedId: null,
        shareExpiry: 0
      },
    });
    return folder;
  } else {
    const MS_IN_24_HRS = 1000 * 60 * 60 * 24; // 24 hours in milliseconds
    const shareExpiry = Date.now() + MS_IN_24_HRS * Number(shareDuration)
    const shareId = `${folderId}-${crypto.randomBytes(14).toString("hex")}`; 

    // setup shareExpiry in the db to be a date in the future
    // based on the epoch plus the ms in the passed in value of shareDuration which is in days
    const folder = prisma.folder.update({
      where: {
        authorId: Number(authorId),
        parentId: parentId ? Number(parentId) : null,
        id: Number(folderId),
      },
      data: {
        sharedId: shareId,
        shareExpiry: shareExpiry,
      },
    });
    return folder;
  }
}

function removeShareSettings(id) {
  console.log('in removeShareSettings: ', id)
  const folder = prisma.folder.update({
    where: {
      id: Number(id),
      shareExpiry: 0,
      sharedId: null
    }
  })
  return folder;
}

function updateFolder (authorId, parentId, folderId, newName) {
  console.log('in updateFolder: ', authorId, parentId, folderId, newName)
  const folder = prisma.folder.update({
    where: {
      authorId: Number(authorId),
      parentId: parentId ? Number(parentId) : null,
      id: Number(folderId),
    },
    data: {
      name: newName,
      updatedAt: new Date().toISOString(),
    },
  });
  return folder
}

function getFiles (authorId, parentId) {
  console.log('in getFiles: ', authorId, parentId)
  const files = prisma.file.findMany({
    where: {
      parentId: Number(parentId),
      authorId: Number(authorId)
    }
  })
  return files
}

function getFolders (authorId, parentId) {
  console.log('in getFolders: ', authorId, parentId)
  const folders = prisma.folder.findMany({
    where: {
      authorId: Number(authorId),
      parentId: Number(parentId)
    }
  })
  return folders
}

function getFolder (authorId, id) {
  console.log('in getFolder: ', authorId, id)
  const folder = prisma.folder.findUnique({
    where: {
      id: Number(id),
      authorId: Number(authorId)
    }
  })
  return folder
}

function deleteFileById (authorId, id) {
  console.log('in deleteFile: ', authorId, id)
  const deletedFile = prisma.file.delete({
    where: {
      authorId: Number(authorId),
      id: Number(id)
    }
  })
  return deletedFile
}
function deleteFolder (authorId, id) {
  console.log('in deleteFolder: ', authorId, id)
  const deletedFolder = prisma.folder.delete({
    where: {
      id: Number(id),
      authorId: Number(authorId)
    }
  })
  return deletedFolder
}

function getFileById (id) {
  console.log('in getFilesById:', id)
  const file = prisma.file.findUnique({
    where: {
      id: Number(id)
    }
  })
  return file
}

function getUniqueFile (authorId, parentId, id) {
  console.log('in getUniqueFile: ', authorId, parentId, id)
  const file = prisma.file.findUnique({
    where: {
      authorId: Number(authorId),
      parentId: Number(parentId),
      id: Number(id)
    }
  })
  return file
}

function getUniqueFolder (name, parentId, authorId) {
  console.log('in getUniqueFolder: ', name, parentId, authorId)
  const folder = prisma.folder.findUnique({
    where: {
      authorId_name_parentId: {
        authorId: Number(authorId),
        name,
        parentId: Number(parentId)
      }
    }
  })
  return folder
}

async function findRootSharedFolder(authorId, sharedId, folderPathArr) {
  console.log("in findRootSharedFolder: ", authorId, sharedId, folderPathArr);

  const folder = await prisma.folder.findFirst({
    where: {
      id: {
        in: folderPathArr,
      },
      authorId: Number(authorId),
      sharedId,
    },
  });

  return folder;
}

async function getFolderPath (authorId, folderIds, sharedId, path = []) {
  console.log('--------->>>>> in getFolderPath: ', authorId, folderIds, sharedId, path)
  if (!folderIds || folderIds.length === 0) {
    return path ?? []
  }
  const currFolderId = folderIds.pop()
  const folder = await prisma.folder.findUnique({
    where: {
      id: Number(currFolderId)
    },
    select: {
      id: true,
      pathArr: true,
      name: true,
      sharedId: true
    }
  })
  if (!folder) {
    throw new Error('folder in getFolderPath query should not be null')
  }
  console.log('folder found: ', folder)
  path.unshift({ id: folder.id, name: folder.name })
  console.log('path: ', path)
  if (folder.pathArr && folder.pathArr.length > 0) {
    folderIds = Array.from(new Set([...folderIds, ...folder.pathArr]))
  }
  if (folder.sharedId === sharedId) {
    return path ?? []
  } else {
    return getFolderPath(authorId, folderIds, sharedId, path)
  }
}

module.exports = {
  createRootFolder,
  getFiles,
  getFileById,
  getUniqueFile,
  getFolders,
  hasRootFolder,
  getFolder,
  createFolder,
  createFile,
  getFolderPath,
  deleteFolder,
  getUniqueFolder,
  shareFolder,
  updateFolder,
  removeShareSettings,
  findRootSharedFolder,
  deleteFileById,
};
