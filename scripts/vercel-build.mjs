import { spawnSync } from "node:child_process";

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
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

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required for Vercel. Add a Postgres database and set DATABASE_URL + DIRECT_URL.");
  process.exit(1);
}

if (!process.env.AUTH_SECRET) {
  console.error("AUTH_SECRET is required for Vercel. Generate one with: openssl rand -base64 32");
  process.exit(1);
}

run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["next", "build"]);
