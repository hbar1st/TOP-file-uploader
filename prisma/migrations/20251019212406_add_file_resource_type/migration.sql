/*
  Warnings:

  - You are about to drop the column `location` on the `File` table. All the data in the column will be lost.
  - Added the required column `publicId` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource_type` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "location",
ADD COLUMN     "publicId" VARCHAR(255) NOT NULL,
ADD COLUMN     "resource_type" TEXT NOT NULL;
