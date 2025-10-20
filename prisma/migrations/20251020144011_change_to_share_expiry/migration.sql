/*
  Warnings:

  - You are about to drop the column `shareDuration` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `shareDuration` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "shareDuration",
ADD COLUMN     "shareExpiry" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "shareDuration",
ADD COLUMN     "shareExpiry" INTEGER NOT NULL DEFAULT 0;
