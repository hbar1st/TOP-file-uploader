/*
  Warnings:

  - You are about to alter the column `pathArr` on the `Folder` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "pathArr" SET DATA TYPE INTEGER[],
ALTER COLUMN "shareExpiry" SET DATA TYPE BIGINT;
