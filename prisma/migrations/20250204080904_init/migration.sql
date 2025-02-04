-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "repository" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "last_commit_retrieval_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commits" (
    "branch_id" INTEGER NOT NULL,
    "retrieval_time" TIMESTAMP(3) NOT NULL,
    "commit_hash" TEXT NOT NULL,

    CONSTRAINT "commits_pkey" PRIMARY KEY ("branch_id","retrieval_time")
);

-- CreateIndex
CREATE INDEX "branches_last_commit_retrieval_time_index" ON "branches"("last_commit_retrieval_time");

-- CreateIndex
CREATE UNIQUE INDEX "branches_repository_branch_key" ON "branches"("repository", "branch");

-- AddForeignKey
ALTER TABLE "commits" ADD CONSTRAINT "fk_branches" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
