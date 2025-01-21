/*
  Warnings:

  - Added the required column `last_commit_retrieval_time` to the `branches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "last_commit_retrieval_time" TIMESTAMP(0) NOT NULL;

-- CreateIndex
CREATE INDEX "branches_last_commit_retrieval_time_index" ON "branches"("last_commit_retrieval_time");
