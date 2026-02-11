-- AlterTable: Convert bloomLevel (single string) to bloomLevels (string array)
-- First add the new column
ALTER TABLE "CourseOutcome" ADD COLUMN "bloomLevels" TEXT[];

-- Migrate existing data: wrap the single value into an array
UPDATE "CourseOutcome" SET "bloomLevels" = ARRAY["bloomLevel"] WHERE "bloomLevel" IS NOT NULL;
UPDATE "CourseOutcome" SET "bloomLevels" = '{}' WHERE "bloomLevel" IS NULL;

-- Set NOT NULL after data migration
ALTER TABLE "CourseOutcome" ALTER COLUMN "bloomLevels" SET DEFAULT '{}';

-- Drop the old column
ALTER TABLE "CourseOutcome" DROP COLUMN "bloomLevel";
