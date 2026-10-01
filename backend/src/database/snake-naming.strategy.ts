import { DefaultNamingStrategy, type NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils.js';

/**
 * Maps camelCase entity and property names to snake_case tables and columns
 * (`CourseDay.heldOn` → `course_day.held_on`), so the SQL schema reads the way
 * the design spec writes it. Explicit `name` options still win.
 */
export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  override tableName(targetName: string, userSpecifiedName?: string): string {
    return userSpecifiedName ?? snakeCase(targetName);
  }

  override columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    const prefix = embeddedPrefixes.map((p) => snakeCase(p)).join('_');
    const name = customName ?? snakeCase(propertyName);
    return prefix ? `${prefix}_${name}` : name;
  }

  override relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  override joinColumnName(
    relationName: string,
    referencedColumnName: string,
  ): string {
    return snakeCase(`${relationName}_${referencedColumnName}`);
  }

  override joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
  ): string {
    return snakeCase(
      `${firstTableName}_${firstPropertyName.replace(/\./g, '_')}_${secondTableName}`,
    );
  }

  override joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(`${tableName}_${columnName ?? propertyName}`);
  }
}
