export function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

export function resolveDirectUrl() {
  return (
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    resolveDatabaseUrl()
  );
}

export function hasConfiguredDatabase() {
  return Boolean(resolveDatabaseUrl());
}
