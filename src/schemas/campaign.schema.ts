import { defineTable } from '../database/schema/define-table.js';

export const campaignsTable = defineTable({
  name: 'campaigns',
  columns: {
    id: { type: 'uuid', primary: true },
    name: { type: 'varchar', required: true },
    description: { type: 'text' },
    status: { type: 'varchar', default: 'draft' },
    is_active: { type: 'boolean', default: true },
    budget: { type: 'int' },
    created_at: { type: 'timestamp', default: 'now()' },
    updated_at: { type: 'timestamp', default: 'now()' },
  },
  indexes: [
    { columns: ['status'] },
    { columns: ['name'], unique: true },
    { columns: ['status', 'is_active'], name: 'idx_campaigns_active_status' },
  ],
});
