// ─── Aggregate export ────────────────────────────────────────────────────────
// Import this array in the runner to sync all tables at once.

import { campaignsTable } from './campaign.schema.js';
import { usersTable } from './user.schema.js';
import { shopTable } from './shop.schema.js';

import type { TableSchema } from '../database/schema/types.js';

/**
 * All table schemas in the project.
 * Add new schemas here and they will be picked up by the migration runner.
 */
export const allSchemas: TableSchema[] = [shopTable];
