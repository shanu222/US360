import { spawnSync } from "node:child_process";

const placeholderDb = "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";
const hasDatabase = Boolean(process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = placeholderDb;
  console.warn(
    "DATABASE_URL is not set. Skipping Prisma migrations so this Vercel build can finish. Add a Postgres database in the Vercel dashboard for login and saved data.",
  );
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = "vercel-build-placeholder-set-AUTH_SECRET-in-project-env";
  console.warn(
    "AUTH_SECRET is not set. Using a build placeholder. Set AUTH_SECRET in Vercel env vars before using authentication.",
  );
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "generate"]);

if (hasDatabase) {
  run("npx", ["prisma", "migrate", "deploy"]);
} else {
  console.warn("Skipping `prisma migrate deploy` because DATABASE_URL was not provided.");
}

run("npx", ["next", "build"]);
