import type { DataSourceOptions } from 'typeorm';

type Env = Record<string, string | undefined>;

/**
 * Shared TypeORM options, used both by the Nest app and by the TypeORM CLI
 * (see data-source.ts). Paths are relative to the compiled `dist` folder.
 *
 * On Heroku the connection comes from `DATABASE_URL`, which takes precedence
 * over the individual `DB_*` variables. Heroku Postgres requires SSL with a
 * self-signed certificate, so SSL is on by default whenever `DATABASE_URL`
 * is set (override with `DB_SSL=false`).
 */
export function buildDataSourceOptions(
  env: Env = process.env,
): DataSourceOptions {
  const ssl = (env.DB_SSL ?? (env.DATABASE_URL ? 'true' : 'false')) === 'true';
  const connection = env.DATABASE_URL
    ? { url: env.DATABASE_URL }
    : {
        host: env.DB_HOST ?? 'localhost',
        port: Number(env.DB_PORT ?? 5434),
        username: env.DB_USER ?? 'svbl',
        password: env.DB_PASSWORD ?? 'svbl',
        database: env.DB_NAME ?? 'svbl_planungstool',
      };

  return {
    type: 'postgres',
    ...connection,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    logging: env.DB_LOGGING === 'true',
    entities: [new URL('../**/*.entity.js', import.meta.url).pathname],
    migrations: [new URL('./migrations/*.js', import.meta.url).pathname],
    // Schema changes go through migrations only.
    synchronize: false,
  };
}
