import { buildDataSourceOptions } from './database.options.js';

describe('buildDataSourceOptions', () => {
  it('uses the DB_* settings without SSL by default', () => {
    const options = buildDataSourceOptions({ DB_HOST: 'db', DB_PORT: '5432' });

    expect(options).toMatchObject({ host: 'db', port: 5432, ssl: false });
    expect(options).not.toHaveProperty('url');
  });

  it('prefers DATABASE_URL and enables SSL for it', () => {
    const options = buildDataSourceOptions({
      DATABASE_URL: 'postgres://u:p@heroku:5432/d',
      DB_HOST: 'ignored',
    });

    expect(options).toMatchObject({
      url: 'postgres://u:p@heroku:5432/d',
      ssl: { rejectUnauthorized: false },
    });
    expect(options).not.toHaveProperty('host');
  });

  it('lets DB_SSL override the default', () => {
    expect(
      buildDataSourceOptions({ DATABASE_URL: 'postgres://x', DB_SSL: 'false' }),
    ).toMatchObject({ ssl: false });
    expect(buildDataSourceOptions({ DB_SSL: 'true' })).toMatchObject({
      ssl: { rejectUnauthorized: false },
    });
  });
});
