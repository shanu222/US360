import { spawnSync } from "node:child_process";

const placeholderDb = "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || "";
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || "";
}

const hasDatabase = Boolean(process.env.DATABASE_URL);

if (!hasDatabase) {
  process.env.DATABASE_URL = placeholderDb;
  process.env.DIRECT_URL = placeholderDb;
  console.warn(
    "No Postgres URL found. Skipping migrations. In Vercel: Storage → Create Database → Postgres, then redeploy.",
  );
}

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = "vercel-build-placeholder-set-AUTH_SECRET-in-project-env";
  console.warn("AUTH_SECRET is not set. Add it in Vercel → Settings → Environment Variables.");
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
  console.warn("Skipping `prisma migrate deploy` because no database URL was provided.");
}

run("npx", ["next", "build"]);
