import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_ENTITIES } from './entities.js';

/** Every `*.entity.ts` under src/ (except the abstract base) must be registered. */
function entityFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return entityFiles(p);
    return d.name.endsWith('.entity.ts') && d.name !== 'base.entity.ts'
      ? [p]
      : [];
  });
}

describe('ALL_ENTITIES', () => {
  it('lists every entity file once', () => {
    const files = entityFiles(join(import.meta.dirname, '..'));
    expect(ALL_ENTITIES.length).toBe(files.length);
    expect(new Set(ALL_ENTITIES).size).toBe(ALL_ENTITIES.length);
  });
});
