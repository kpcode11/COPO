// Prisma ESM config for migrations & migrate tooling.
// ESM is a safe format for the Prisma CLI to parse without TypeScript transpilation.
export default {
  migrate: {
    url: process.env.DATABASE_URL,
    shadowUrl: process.env.DATABASE_SHADOW_URL,
  },
};
