# CO-PO Attainment System

A comprehensive Course Outcome (CO) and Program Outcome (PO) Attainment System for engineering colleges, strictly aligned with Outcome Based Education (OBE) and NBA accreditation practices.

## Tech Stack

- **Frontend**: Next.js 15+, TypeScript, App Router, Server Components
- **Backend**: Server Actions, Attainment Engine
- **Database**: Neon PostgreSQL, Prisma ORM, Prisma Accelerate
- **Validation**: Zod
- **File Handling**: xlsx, papaparse
- **Auth**: NextAuth (Auth.js v5), server-side RBAC
- **Styling**: Tailwind CSS

## Project Structure

```
COPO/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Initial data seeding
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── admin/         # Admin role pages
│   │   │   │   ├── academic-years/
│   │   │   │   ├── semesters/
│   │   │   │   ├── departments/
│   │   │   │   ├── programs/
│   │   │   │   ├── courses/
│   │   │   │   ├── teachers/
│   │   │   │   ├── settings/
│   │   │   │   │   ├── global-config/
│   │   │   │   │   ├── thresholds/
│   │   │   │   │   └── weightages/
│   │   │   │   ├── surveys/
│   │   │   │   │   ├── course-exit/
│   │   │   │   │   └── program-exit/
│   │   │   │   ├── attainment/
│   │   │   │   │   ├── co/
│   │   │   │   │   └── po/
│   │   │   │   ├── reports/
│   │   │   │   └── audit-logs/
│   │   │   ├── hod/           # HOD role pages
│   │   │   │   ├── courses/
│   │   │   │   ├── teachers/
│   │   │   │   ├── attainment/
│   │   │   │   │   ├── co/
│   │   │   │   │   └── po/
│   │   │   │   ├── reports/
│   │   │   │   └── cqi-review/
│   │   │   └── teacher/       # Teacher role pages
│   │   │       └── courses/
│   │   │           └── [courseId]/
│   │   │               ├── outcomes/
│   │   │               ├── assessments/
│   │   │               │   └── [assessmentId]/
│   │   │               │       ├── questions/
│   │   │               │       └── marks/
│   │   │               ├── co-po-mapping/
│   │   │               ├── attainment/
│   │   │               └── cqi/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── actions/               # Server Actions
│   │   ├── admin/
│   │   │   ├── academic-year.actions.ts
│   │   │   ├── semester.actions.ts
│   │   │   ├── department.actions.ts
│   │   │   ├── program.actions.ts
│   │   │   ├── course.actions.ts
│   │   │   ├── teacher.actions.ts
│   │   │   ├── config.actions.ts
│   │   │   ├── survey.actions.ts
│   │   │   ├── report.actions.ts
│   │   │   └── audit.actions.ts
│   │   ├── hod/
│   │   │   ├── course.actions.ts
│   │   │   ├── teacher.actions.ts
│   │   │   ├── attainment.actions.ts
│   │   │   ├── report.actions.ts
│   │   │   └── cqi.actions.ts
│   │   ├── teacher/
│   │   │   ├── course-outcome.actions.ts
│   │   │   ├── assessment.actions.ts
│   │   │   ├── question-mapping.actions.ts
│   │   │   ├── marks.actions.ts
│   │   │   ├── co-po-mapping.actions.ts
│   │   │   ├── cqi.actions.ts
│   │   │   └── attainment.actions.ts
│   │   └── common/
│   │       ├── auth.actions.ts
│   │       ├── user.actions.ts
│   │       └── dashboard.actions.ts
│   ├── components/            # React Components
│   │   ├── ui/               # Base UI components
│   │   ├── layout/           # Layout components
│   │   ├── forms/            # Form components
│   │   ├── tables/           # Table components
│   │   ├── charts/           # Chart components
│   │   ├── cards/            # Card components
│   │   ├── modals/           # Modal components
│   │   ├── file-upload/      # File upload components
│   │   ├── dashboard/        # Dashboard components
│   │   └── attainment/       # Attainment display components
│   ├── lib/                   # Core libraries
│   │   ├── db/
│   │   │   ├── prisma.ts
│   │   │   └── utils.ts
│   │   ├── auth/
│   │   │   ├── auth.config.ts
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts
│   │   │   └── password.ts
│   │   ├── attainment-engine/
│   │   │   ├── co-calculator.ts
│   │   │   ├── po-calculator.ts
│   │   │   ├── level-resolver.ts
│   │   │   ├── survey-calculator.ts
│   │   │   ├── weightage-calculator.ts
│   │   │   └── index.ts
│   │   ├── file-handlers/
│   │   │   ├── csv-parser.ts
│   │   │   ├── excel-parser.ts
│   │   │   ├── survey-parser.ts
│   │   │   └── index.ts
│   │   ├── validators/
│   │   │   ├── marks-validator.ts
│   │   │   ├── survey-validator.ts
│   │   │   ├── mapping-validator.ts
│   │   │   └── index.ts
│   │   └── reports/
│   │       ├── co-report.ts
│   │       ├── po-report.ts
│   │       ├── department-report.ts
│   │       ├── semester-report.ts
│   │       ├── pdf-generator.ts
│   │       ├── excel-generator.ts
│   │       └── index.ts
│   ├── schemas/               # Zod validation schemas
│   │   ├── admin/
│   │   ├── hod/
│   │   ├── teacher/
│   │   └── common/
│   ├── types/                 # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── academic.types.ts
│   │   ├── course.types.ts
│   │   ├── attainment.types.ts
│   │   ├── marks.types.ts
│   │   ├── survey.types.ts
│   │   ├── report.types.ts
│   │   └── index.ts
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-config.ts
│   │   ├── use-toast.ts
│   │   ├── use-modal.ts
│   │   └── use-file-upload.ts
│   ├── constants/             # Application constants
│   │   ├── routes.ts
│   │   ├── bloom-levels.ts
│   │   ├── attainment-levels.ts
│   │   ├── survey-options.ts
│   │   └── default-config.ts
│   ├── utils/                 # Utility functions
│   │   ├── helpers.ts
│   │   ├── date.ts
│   │   ├── cn.ts
│   │   └── error.ts
│   └── middleware.ts          # Next.js middleware
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── .gitignore
└── README.md
```

## User Roles

### Admin (System Owner / IQAC Authority)
- Full governance control
- Manage academic years, semesters, departments, programs
- Create courses and assign to departments/programs
- Create teachers and assign to courses
- Define global CO/PO attainment standards
- Configure assessment weightages (IA1, IA2, End-Sem)
- Manage Course Exit and Program Exit Surveys
- View institution-wide CO/PO attainment
- Generate reports
- Lock/freeze semester data
- View audit logs

### HOD (Department Authority)
- Manage courses and teachers in their department
- Assign teachers to courses
- View department-level CO/PO attainment
- Generate department reports
- Review CQI actions

### Teacher (Course Owner)
- Define Course Outcomes (COs)
- Create assessments (IA1, IA2, End-Sem)
- Map questions to COs
- Upload student marks (CSV/Excel)
- View calculated CO attainment
- Define CO-PO mapping
- Submit CQI actions for underperforming COs

## Attainment Calculation Logic

### Direct CO Attainment
1. For each CO in each assessment, check if students scored ≥60% of CO-mapped marks
2. Calculate: `(Students meeting target / Total students) × 100`
3. Assign attainment level (0-3) based on thresholds
4. Weighted average: `Direct CO = (IA1 × 0.2) + (IA2 × 0.2) + (End-Sem × 0.6)`

### Indirect CO Attainment
- From Course Exit Survey (Likert scale: Strongly Agree=3, Agree=2, Neutral=1, Disagree=0)
- `Indirect CO = Σ(Response Score) / Total Responses`

### Final CO Attainment
`Final CO = (Direct CO × 0.8) + (Indirect CO × 0.2)`

### PO Attainment
- Uses CO-PO mapping matrix (0-3 scale)
- `PO (Course) = Σ(CO Attainment × CO-PO Mapping) / Σ(CO-PO Mapping)`
- `Program PO = Average of all course-level PO values`
- Final: `Final PO = (Direct PO × 0.8) + (Indirect PO × 0.2)`

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure database URL
3. Install dependencies: `npm install`
4. Generate Prisma client: `npm run db:generate`
5. Push schema to database: `npm run db:push`
6. Seed initial data: `npm run db:seed`
7. Start development server: `npm run dev`

## License

MIT
