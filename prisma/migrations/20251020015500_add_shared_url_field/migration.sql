/*
  Warnings:

  - Added the required column `sharedURL` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sharedURL` to the `Folder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "sharedURL" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "sharedURL" TEXT NOT NULL;
