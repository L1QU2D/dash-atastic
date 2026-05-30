import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Create accounts table
  await db.run(sql`CREATE TABLE \`accounts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`google_oauth_google_email\` text,
  	\`google_oauth_google_refresh_token\` text,
  	\`google_oauth_google_access_token\` text,
  	\`google_oauth_google_token_expiry\` text,
  	\`google_oauth_google_connected_at\` text,
  	\`google_oauth_google_scopes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`accounts_updated_at_idx\` ON \`accounts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`accounts_created_at_idx\` ON \`accounts\` (\`created_at\`);`)

  // 2. Insert a default account for existing data
  await db.run(sql`INSERT INTO \`accounts\` (\`id\`, \`name\`) VALUES (1, 'Default Network');`)

  // 3. Add account_id columns with default pointing to the default account
  //    SQLite requires a default when adding NOT NULL to a table with existing rows
  await db.run(sql`ALTER TABLE \`users\` ADD \`account_id\` integer NOT NULL DEFAULT 1 REFERENCES accounts(id);`)
  await db.run(sql`CREATE INDEX \`users_account_idx\` ON \`users\` (\`account_id\`);`)
  await db.run(sql`ALTER TABLE \`sites\` ADD \`account_id\` integer NOT NULL DEFAULT 1 REFERENCES accounts(id);`)
  await db.run(sql`CREATE INDEX \`sites_account_idx\` ON \`sites\` (\`account_id\`);`)

  // 4. Locked documents rels
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`accounts_id\` integer REFERENCES accounts(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_accounts_id_idx\` ON \`payload_locked_documents_rels\` (\`accounts_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`accounts\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`role\` text DEFAULT 'viewer' NOT NULL,
  	\`mfa_enabled\` integer DEFAULT false,
  	\`last_login_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`INSERT INTO \`__new_users\`("id", "role", "mfa_enabled", "last_login_at", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until") SELECT "id", "role", "mfa_enabled", "last_login_at", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until" FROM \`users\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`ALTER TABLE \`__new_users\` RENAME TO \`users\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`__new_sites\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`domain\` text NOT NULL,
  	\`status\` text DEFAULT 'active' NOT NULL,
  	\`niche\` text NOT NULL,
  	\`niche_group\` text,
  	\`market\` text NOT NULL,
  	\`tier\` text NOT NULL,
  	\`pinned\` integer DEFAULT false,
  	\`launched_at\` text,
  	\`successor_of_id\` integer,
  	\`standby_for_id\` integer,
  	\`hosting_provider\` text,
  	\`notes\` text,
  	\`external_ids_gsc_property\` text,
  	\`external_ids_ga4_property_id\` text,
  	\`external_ids_subaffiliate_tracking_id\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`successor_of_id\`) REFERENCES \`sites\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`standby_for_id\`) REFERENCES \`sites\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_sites\`("id", "domain", "status", "niche", "niche_group", "market", "tier", "pinned", "launched_at", "successor_of_id", "standby_for_id", "hosting_provider", "notes", "external_ids_gsc_property", "external_ids_ga4_property_id", "external_ids_subaffiliate_tracking_id", "updated_at", "created_at") SELECT "id", "domain", "status", "niche", "niche_group", "market", "tier", "pinned", "launched_at", "successor_of_id", "standby_for_id", "hosting_provider", "notes", "external_ids_gsc_property", "external_ids_ga4_property_id", "external_ids_subaffiliate_tracking_id", "updated_at", "created_at" FROM \`sites\`;`)
  await db.run(sql`DROP TABLE \`sites\`;`)
  await db.run(sql`ALTER TABLE \`__new_sites\` RENAME TO \`sites\`;`)
  await db.run(sql`CREATE UNIQUE INDEX \`sites_domain_idx\` ON \`sites\` (\`domain\`);`)
  await db.run(sql`CREATE INDEX \`sites_status_idx\` ON \`sites\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`sites_successor_of_idx\` ON \`sites\` (\`successor_of_id\`);`)
  await db.run(sql`CREATE INDEX \`sites_standby_for_idx\` ON \`sites\` (\`standby_for_id\`);`)
  await db.run(sql`CREATE INDEX \`sites_updated_at_idx\` ON \`sites\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`sites_created_at_idx\` ON \`sites\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`sites_id\` integer,
  	\`site_metrics_daily_id\` integer,
  	\`link_placements_id\` integer,
  	\`alerts_id\` integer,
  	\`alert_configs_id\` integer,
  	\`incidents_id\` integer,
  	\`content_events_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`sites_id\`) REFERENCES \`sites\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`site_metrics_daily_id\`) REFERENCES \`site_metrics_daily\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`link_placements_id\`) REFERENCES \`link_placements\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`alerts_id\`) REFERENCES \`alerts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`alert_configs_id\`) REFERENCES \`alert_configs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`incidents_id\`) REFERENCES \`incidents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`content_events_id\`) REFERENCES \`content_events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "sites_id", "site_metrics_daily_id", "link_placements_id", "alerts_id", "alert_configs_id", "incidents_id", "content_events_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "sites_id", "site_metrics_daily_id", "link_placements_id", "alerts_id", "alert_configs_id", "incidents_id", "content_events_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_sites_id_idx\` ON \`payload_locked_documents_rels\` (\`sites_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_site_metrics_daily_id_idx\` ON \`payload_locked_documents_rels\` (\`site_metrics_daily_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_link_placements_id_idx\` ON \`payload_locked_documents_rels\` (\`link_placements_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_alerts_id_idx\` ON \`payload_locked_documents_rels\` (\`alerts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_alert_configs_id_idx\` ON \`payload_locked_documents_rels\` (\`alert_configs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_incidents_id_idx\` ON \`payload_locked_documents_rels\` (\`incidents_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_content_events_id_idx\` ON \`payload_locked_documents_rels\` (\`content_events_id\`);`)
}
