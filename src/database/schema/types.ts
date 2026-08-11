// ─── Supported PostgreSQL column types ───────────────────────────────────────

export type ColumnType =
  | 'uuid'
  | 'varchar'
  | 'text'
  | 'boolean'
  | 'timestamp'
  | 'int';

// ─── Column definition ──────────────────────────────────────────────────────

export interface ColumnDefinition {
  /** PostgreSQL data type */
  type: ColumnType;
  /** Mark as PRIMARY KEY */
  primary?: boolean;
  /** Mark as NOT NULL */
  required?: boolean;
  /** Mark as UNIQUE */
  unique?: boolean;
  /** DEFAULT value (string is inserted as-is for expressions like now()) */
  default?: string | number | boolean;
}

// ─── Index definition ────────────────────────────────────────────────────────

export interface IndexDefinition {
  /** Name of the index (auto-generated if omitted) */
  name?: string;
  /** Column(s) to index */
  columns: string[];
  /** Create a UNIQUE index */
  unique?: boolean;
}

// ─── Table schema ────────────────────────────────────────────────────────────

export interface TableSchema {
  /** Table name */
  name: string;
  /** Column definitions keyed by column name */
  columns: Record<string, ColumnDefinition>;
  /** Optional index definitions */
  indexes?: IndexDefinition[];
}
