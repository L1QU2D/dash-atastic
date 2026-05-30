import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`sites\` (
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
  await db.run(sql`CREATE UNIQUE INDEX \`sites_domain_idx\` ON \`sites\` (\`domain\`);`)
  await db.run(sql`CREATE INDEX \`sites_status_idx\` ON \`sites\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`sites_successor_of_idx\` ON \`sites\` (\`successor_of_id\`);`)
  await db.run(sql`CREATE INDEX \`sites_standby_for_idx\` ON \`sites\` (\`standby_for_id\`);`)
  await db.run(sql`CREATE INDEX \`sites_updated_at_idx\` ON \`sites\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`sites_created_at_idx\` ON \`sites\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`site_metrics_daily\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_id\` integer NOT NULL,
  	\`date\` text NOT NULL,
  	\`clicks\` numeric DEFAULT 0,
  	\`impressions\` numeric DEFAULT 0,
  	\`ctr\` numeric,
  	\`avg_position\` numeric,
  	\`indexed_pages\` numeric,
  	\`crawl_errors\` numeric DEFAULT 0,
  	\`sessions\` numeric DEFAULT 0,
  	\`engaged_sessions\` numeric DEFAULT 0,
  	\`affiliate_clicks\` numeric DEFAULT 0,
  	\`conversions\` numeric DEFAULT 0,
  	\`revenue_eur\` numeric DEFAULT 0,
  	\`uptime_pct\` numeric,
  	\`lcp_ms\` numeric,
  	\`inp_ms\` numeric,
  	\`cls\` numeric,
  	\`source_versions\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`site_id\`) REFERENCES \`sites\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`site_metrics_daily_site_idx\` ON \`site_metrics_daily\` (\`site_id\`);`)
  await db.run(sql`CREATE INDEX \`site_metrics_daily_date_idx\` ON \`site_metrics_daily\` (\`date\`);`)
  await db.run(sql`CREATE INDEX \`site_metrics_daily_updated_at_idx\` ON \`site_metrics_daily\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`site_metrics_daily_created_at_idx\` ON \`site_metrics_daily\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`link_placements\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_id\` integer NOT NULL,
  	\`target_url\` text NOT NULL,
  	\`source_domain\` text NOT NULL,
  	\`source_url\` text,
  	\`anchor_text\` text,
  	\`tier\` text NOT NULL,
  	\`dr\` numeric,
  	\`placed_at\` text NOT NULL,
  	\`status\` text DEFAULT 'live' NOT NULL,
  	\`kind\` text,
  	\`cost_eur\` numeric,
  	\`verified_at\` text,
  	\`notes\` text,
  	\`redirect_replacement\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`site_id\`) REFERENCES \`sites\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`link_placements_site_idx\` ON \`link_placements\` (\`site_id\`);`)
  await db.run(sql`CREATE INDEX \`link_placements_updated_at_idx\` ON \`link_placements\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`link_placements_created_at_idx\` ON \`link_placements\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`alerts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_id\` integer NOT NULL,
  	\`kind\` text NOT NULL,
  	\`severity\` text NOT NULL,
  	\`status\` text DEFAULT 'open' NOT NULL,
  	\`triggered_at\` text NOT NULL,
  	\`acknowledged_at\` text,
  	\`acknowledged_by_id\` integer,
  	\`resolved_at\` text,
  	\`signal\` text,
  	\`note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`site_id\`) REFERENCES \`sites\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`acknowledged_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`alerts_site_idx\` ON \`alerts\` (\`site_id\`);`)
  await db.run(sql`CREATE INDEX \`alerts_status_idx\` ON \`alerts\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`alerts_acknowledged_by_idx\` ON \`alerts\` (\`acknowledged_by_id\`);`)
  await db.run(sql`CREATE INDEX \`alerts_updated_at_idx\` ON \`alerts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`alerts_created_at_idx\` ON \`alerts\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`alert_configs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_id\` integer,
  	\`kind\` text NOT NULL,
  	\`enabled\` integer DEFAULT true,
  	\`threshold\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`site_id\`) REFERENCES \`sites\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`alert_configs_site_idx\` ON \`alert_configs\` (\`site_id\`);`)
  await db.run(sql`CREATE INDEX \`alert_configs_updated_at_idx\` ON \`alert_configs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`alert_configs_created_at_idx\` ON \`alert_configs\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`incidents_actions_taken\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`description\` text NOT NULL,
  	\`at\` text,
  	\`by\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`incidents\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`incidents_actions_taken_order_idx\` ON \`incidents_actions_taken\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`incidents_actions_taken_parent_id_idx\` ON \`incidents_actions_taken\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`incidents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_id\` integer NOT NULL,
  	\`title\` text NOT NULL,
  	\`started_at\` text NOT NULL,
  	\`resolved_at\` text,
  	\`outcome\` text,
  	\`summary\` text,
  	\`post_mortem\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`site_id\`) REFERENCES \`sites\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`incidents_site_idx\` ON \`incidents\` (\`site_id\`);`)
  await db.run(sql`CREATE INDEX \`incidents_updated_at_idx\` ON \`incidents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`incidents_created_at_idx\` ON \`incidents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`incidents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`alerts_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`incidents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`alerts_id\`) REFERENCES \`alerts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`incidents_rels_order_idx\` ON \`incidents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`incidents_rels_parent_idx\` ON \`incidents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`incidents_rels_path_idx\` ON \`incidents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`incidents_rels_alerts_id_idx\` ON \`incidents_rels\` (\`alerts_id\`);`)
  await db.run(sql`CREATE TABLE \`content_events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_id\` integer NOT NULL,
  	\`kind\` text NOT NULL,
  	\`count\` numeric NOT NULL,
  	\`at\` text NOT NULL,
  	\`template\` text,
  	\`note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`site_id\`) REFERENCES \`sites\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`content_events_site_idx\` ON \`content_events\` (\`site_id\`);`)
  await db.run(sql`CREATE INDEX \`content_events_updated_at_idx\` ON \`content_events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`content_events_created_at_idx\` ON \`content_events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`branding\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`product_name\` text DEFAULT 'Atastic' NOT NULL,
  	\`customer_tag\` text DEFAULT 'Managed Network',
  	\`primary_color\` text DEFAULT '#2E75B6',
  	\`dark_color\` text DEFAULT '#1F4E79',
  	\`soft_color\` text DEFAULT '#EAF1F7',
  	\`logo_initials\` text DEFAULT 'AT',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`network_defaults\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`default_alert_thresholds\` text DEFAULT '{"indexation_drop_pct":15,"ranking_collapse_positions":10,"traffic_anomaly_pct":25,"uptime_min_pct":99.5}',
  	\`content_refresh_cadence\` numeric DEFAULT 7,
  	\`link_velocity_bands\` text DEFAULT '{"low":{"min":0,"max":5},"normal":{"min":5,"max":20},"high":{"min":20,"max":50},"aggressive":{"min":50,"max":null}}',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`users\` ADD \`role\` text DEFAULT 'viewer' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`mfa_enabled\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`last_login_at\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`sites_id\` integer REFERENCES sites(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`site_metrics_daily_id\` integer REFERENCES site_metrics_daily(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`link_placements_id\` integer REFERENCES link_placements(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`alerts_id\` integer REFERENCES alerts(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`alert_configs_id\` integer REFERENCES alert_configs(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`incidents_id\` integer REFERENCES incidents(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`content_events_id\` integer REFERENCES content_events(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_sites_id_idx\` ON \`payload_locked_documents_rels\` (\`sites_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_site_metrics_daily_id_idx\` ON \`payload_locked_documents_rels\` (\`site_metrics_daily_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_link_placements_id_idx\` ON \`payload_locked_documents_rels\` (\`link_placements_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_alerts_id_idx\` ON \`payload_locked_documents_rels\` (\`alerts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_alert_configs_id_idx\` ON \`payload_locked_documents_rels\` (\`alert_configs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_incidents_id_idx\` ON \`payload_locked_documents_rels\` (\`incidents_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_content_events_id_idx\` ON \`payload_locked_documents_rels\` (\`content_events_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`sites\`;`)
  await db.run(sql`DROP TABLE \`site_metrics_daily\`;`)
  await db.run(sql`DROP TABLE \`link_placements\`;`)
  await db.run(sql`DROP TABLE \`alerts\`;`)
  await db.run(sql`DROP TABLE \`alert_configs\`;`)
  await db.run(sql`DROP TABLE \`incidents_actions_taken\`;`)
  await db.run(sql`DROP TABLE \`incidents\`;`)
  await db.run(sql`DROP TABLE \`incidents_rels\`;`)
  await db.run(sql`DROP TABLE \`content_events\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`branding\`;`)
  await db.run(sql`DROP TABLE \`network_defaults\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`role\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`mfa_enabled\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`last_login_at\`;`)
}
