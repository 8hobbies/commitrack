-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "repository" TEXT NOT NULL,
    "branch" TEXT NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_repository_branch_key" ON "branches"("repository", "branch");
