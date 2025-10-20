/*
  Warnings:

  - You are about to drop the column `shared` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `shared` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "shared";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "shared";
