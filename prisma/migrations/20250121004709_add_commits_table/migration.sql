-- CreateTable
CREATE TABLE "commits" (
    "branch_id" INTEGER NOT NULL,
    "retrieved_time" TIMESTAMP(0) NOT NULL,
    "commit_hash" TEXT NOT NULL,

    CONSTRAINT "commits_pkey" PRIMARY KEY ("branch_id","retrieved_time")
);

-- AddForeignKey
ALTER TABLE "commits" ADD CONSTRAINT "fk_branches" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
