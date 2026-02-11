-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HOD', 'TEACHER');

-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('ODD', 'EVEN');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('IA1', 'IA2', 'ENDSEM');

-- CreateEnum
CREATE TYPE "AttainmentLevel" AS ENUM ('LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3');

-- CreateEnum
CREATE TYPE "SurveyOption" AS ENUM ('STRONGLY_AGREE', 'AGREE', 'NEUTRAL', 'DISAGREE');

-- CreateEnum
CREATE TYPE "CqiStatus" AS ENUM ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SurveyType" AS ENUM ('COURSE', 'PROGRAM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "SemesterType" NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isFirstYear" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTeacher" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "CourseTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOutcome" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bloomLevel" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentMark" (
    "id" TEXT NOT NULL,
    "rollNo" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "questionId" TEXT NOT NULL,
    "marksUploadId" TEXT,

    CONSTRAINT "StudentMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarksUpload" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordCount" INTEGER NOT NULL,

    CONSTRAINT "MarksUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "COAttainment" (
    "id" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "ia1Level" DOUBLE PRECISION,
    "ia2Level" DOUBLE PRECISION,
    "endSemLevel" DOUBLE PRECISION,
    "directScore" DOUBLE PRECISION NOT NULL,
    "indirectScore" DOUBLE PRECISION NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "level" "AttainmentLevel" NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "COAttainment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "COSurveyAggregate" (
    "id" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "responses" INTEGER NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "COSurveyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSurveyUpload" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordCount" INTEGER NOT NULL,

    CONSTRAINT "CourseSurveyUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQIAction" (
    "id" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "remarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CqiStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "CQIAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramOutcome" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "ProgramOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoPoMapping" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "programOutcomeId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "CoPoMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POAttainment" (
    "id" TEXT NOT NULL,
    "programOutcomeId" TEXT NOT NULL,
    "directScore" DOUBLE PRECISION NOT NULL,
    "indirectScore" DOUBLE PRECISION NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POAttainment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSurveyUpload" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordCount" INTEGER NOT NULL,

    CONSTRAINT "ProgramSurveyUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSurveyAggregate" (
    "id" TEXT NOT NULL,
    "programOutcomeId" TEXT NOT NULL,
    "responses" INTEGER NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "POSurveyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyTemplate" (
    "id" TEXT NOT NULL,
    "type" "SurveyType" NOT NULL,
    "entityId" TEXT,
    "template" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalConfig" (
    "id" TEXT NOT NULL,
    "coTargetPercent" DOUBLE PRECISION NOT NULL,
    "coTargetMarksPercent" DOUBLE PRECISION NOT NULL,
    "directWeightage" DOUBLE PRECISION NOT NULL,
    "indirectWeightage" DOUBLE PRECISION NOT NULL,
    "ia1Weightage" DOUBLE PRECISION NOT NULL,
    "ia2Weightage" DOUBLE PRECISION NOT NULL,
    "endSemWeightage" DOUBLE PRECISION NOT NULL,
    "poTargetLevel" DOUBLE PRECISION NOT NULL,
    "level3Threshold" DOUBLE PRECISION NOT NULL,
    "level2Threshold" DOUBLE PRECISION NOT NULL,
    "level1Threshold" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalConfigHistory" (
    "id" TEXT NOT NULL,
    "globalConfigId" TEXT,
    "changedBy" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalConfigHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "COAttainment_courseOutcomeId_key" ON "COAttainment"("courseOutcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "COSurveyAggregate_courseOutcomeId_key" ON "COSurveyAggregate"("courseOutcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "CoPoMapping_courseOutcomeId_programOutcomeId_key" ON "CoPoMapping"("courseOutcomeId", "programOutcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "POAttainment_programOutcomeId_key" ON "POAttainment"("programOutcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "POSurveyAggregate_programOutcomeId_key" ON "POSurveyAggregate"("programOutcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTeacher" ADD CONSTRAINT "CourseTeacher_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTeacher" ADD CONSTRAINT "CourseTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOutcome" ADD CONSTRAINT "CourseOutcome_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMark" ADD CONSTRAINT "StudentMark_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMark" ADD CONSTRAINT "StudentMark_marksUploadId_fkey" FOREIGN KEY ("marksUploadId") REFERENCES "MarksUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarksUpload" ADD CONSTRAINT "MarksUpload_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COAttainment" ADD CONSTRAINT "COAttainment_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COSurveyAggregate" ADD CONSTRAINT "COSurveyAggregate_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSurveyUpload" ADD CONSTRAINT "CourseSurveyUpload_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CQIAction" ADD CONSTRAINT "CQIAction_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramOutcome" ADD CONSTRAINT "ProgramOutcome_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoPoMapping" ADD CONSTRAINT "CoPoMapping_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoPoMapping" ADD CONSTRAINT "CoPoMapping_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoPoMapping" ADD CONSTRAINT "CoPoMapping_programOutcomeId_fkey" FOREIGN KEY ("programOutcomeId") REFERENCES "ProgramOutcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POAttainment" ADD CONSTRAINT "POAttainment_programOutcomeId_fkey" FOREIGN KEY ("programOutcomeId") REFERENCES "ProgramOutcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalConfigHistory" ADD CONSTRAINT "GlobalConfigHistory_globalConfigId_fkey" FOREIGN KEY ("globalConfigId") REFERENCES "GlobalConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
