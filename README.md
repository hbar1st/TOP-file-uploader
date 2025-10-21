# TOP-file-uploader
A stripped down file uploader for The Odin Project practice with Prisma

This app is currently hosted on Koyeb (while it is in development only).

**[Live App Link](https://zealous-galina-hbar1stdev-cab86b9b.koyeb.app/ "File Uploader App")**


[] create a menu with the option to change the user's name or password
[] maybe also allow them to change their email address but that would require that they type in a special code that you sent them (which would expire in 5 minutes?)
[] figure out the routes for CRUD on files (missing ability to update file names at the moment)
[] figure out why the production deployment 500.ejs file is showing the error msg publicly (hide it from the public)
[] add a way to copy share link without having to go back to the Manage Sharing result page
[] try to write code to add the username into the publicId used by cloudinary to identify the files? Either that or use custom/dynamic folders for each user?
[] i have a lot of duplicated logic especially in fileQueries.js between calls to prisma.file and prisma.folder. I can clean the duplicates if I add a flag to toggle between the two objects like:
```js
someDuplicatedFunction(isFile) {
  const prismaObj = isFile ? prisma.file : prisma.folder;
}
```