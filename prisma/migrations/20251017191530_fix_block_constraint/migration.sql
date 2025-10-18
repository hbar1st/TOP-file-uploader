/*
  Warnings:

  - A unique constraint covering the columns `[authorId,name,parentId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authorId,name,parentId]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."File_name_parentId_key";

-- DropIndex
DROP INDEX "public"."Folder_name_parentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "File_authorId_name_parentId_key" ON "File"("authorId", "name", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_authorId_name_parentId_key" ON "Folder"("authorId", "name", "parentId");
