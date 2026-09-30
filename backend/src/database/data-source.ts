import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.options.js';

// Entry point for the TypeORM CLI (migrations). Not used by the Nest app.
export default new DataSource(buildDataSourceOptions());
