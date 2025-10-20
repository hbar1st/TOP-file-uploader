/*
  Warnings:

  - You are about to drop the column `sharedURL` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `sharedURL` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "sharedURL",
ADD COLUMN     "sharedId" TEXT,
ALTER COLUMN "shareExpiry" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "sharedURL",
ADD COLUMN     "sharedId" TEXT,
ALTER COLUMN "pathArr" SET DATA TYPE BIGINT[];
