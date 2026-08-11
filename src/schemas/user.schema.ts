import { defineTable } from '../database/schema/define-table.js';

export const usersTable = defineTable({
  name: 'users',
  columns: {
    id: { type: 'uuid', primary: true },
    email: { type: 'varchar', required: true, unique: true },
    full_name: { type: 'varchar', required: true },
    avatar_url: { type: 'text' },
    is_admin: { type: 'boolean', default: false },
    created_at: { type: 'timestamp', default: 'now()' },
    updated_at: { type: 'timestamp', default: 'now()' },
  },
  indexes: [
    { columns: ['email'], unique: true },
  ],
});
