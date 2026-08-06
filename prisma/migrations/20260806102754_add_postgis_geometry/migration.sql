-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- AlterTable
ALTER TABLE "Journey" ADD COLUMN     "destPoint" geometry(Point, 4326),
ADD COLUMN     "originPoint" geometry(Point, 4326);

-- AlterTable
ALTER TABLE "Load" ADD COLUMN     "destPoint" geometry(Point, 4326),
ADD COLUMN     "originPoint" geometry(Point, 4326);

-- CreateIndex
CREATE INDEX "Journey_originPoint_idx" ON "Journey" USING GIST ("originPoint");

-- CreateIndex
CREATE INDEX "Journey_destPoint_idx" ON "Journey" USING GIST ("destPoint");

-- CreateIndex
CREATE INDEX "Load_originPoint_idx" ON "Load" USING GIST ("originPoint");

-- CreateIndex
CREATE INDEX "Load_destPoint_idx" ON "Load" USING GIST ("destPoint");
