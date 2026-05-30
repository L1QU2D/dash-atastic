# Atastic — Network Operations Dashboard

**Spec version:** 0.1 (initial cut for implementation discussion)
**Audience:** the developer who will implement this
**Status:** internal, pre-build
**Last updated:** 2026-05-30

---

## 1. What this is

A web application that gives a small team a single place to monitor and operate a managed network of programmatic SEO sites (50 sites at MVP, designed to scale further). Built as a **Payload CMS v3 (Next.js)** app, hosted on a single cloud provider, with **PostgreSQL** as the database and Google Search Console + Google Analytics 4 + internal feeds as data sources.

The reference for what the product should look like is the two HTML mockups in this folder:

- `dashboard_mockup.html` — the network overview (9-card grid + filters + summary tiles)
- `dashboard_site_detail_mockup.html` — the drill-down view for a single site (GSC, GA, indexation, link profile, content pipeline, alerts, incident timeline)

Build the application so those two views are reachable, real, and backed by live data. Everything else in this spec is in service of those two pages working well.

---

## 2. Naming & branding

- **Product/company name:** Atastic. Use this in the top bar, page titles, emails, and anywhere the operating brand appears.
- **Customer-facing tag in top bar** (visible to users): the customer name. For the first deployment that is a placeholder ("Cat Media" in the mockups) — keep it as a configurable string so it can be set per environment.
- **Avoid** baking any specific customer name into code paths, collection names, or environment variables. The product is a network operations platform; the first customer happens to be the one. Build for multi-tenant-ready even if we only run one tenant initially.

---

## 3. Access model

Small group of users, role-based:

| Role | Can do |
|------|--------|
| `admin` | Everything, including user management, integration credentials, alert config |
| `operator` | Read everything, create/edit incidents, trigger content/link actions, acknowledge alerts |
| `viewer` | Read-only access to dashboards and reports — this is the role for customer-side users |

All authentication and roles handled by Payload's built-in auth (`auth: true` on the `users` collection). No public signup; admins invite users by email. Magic-link or password + TOTP — TOTP is required for `admin` and `operator`.

Session lifetime: 12 hours. IP allowlist on `admin` role (configurable).

---

## 4. Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Payload CMS v3 | Uses Next.js as host, so we get the admin UI, auth, REST + GraphQL APIs, and custom Next pages in one project |
| Database | PostgreSQL 15+ | Time-series metrics are stored as rows; PG is more ergonomic than Mongo here. Use `@payloadcms/db-postgres` adapter |
| Hosting | Vercel or Railway for the app, Neon or Supabase for the database | Pick one and stick with it. Vercel + Neon is the simplest path |
| Background jobs | Payload jobs queue (built-in in v3) | One worker process. Cron-style schedules for metric pulls; ad-hoc triggers for failover actions |
| File storage | S3-compatible (Cloudflare R2 is cheap and good) | For exported reports, screenshots, optional snapshots |
| Charts | `recharts` or `chart.js` via `react-chartjs-2` | Charts already prototyped as inline SVG in the mockups; either library is fine for the build. Stick to one |
| Styling | Tailwind CSS | Match the mockups' palette (see Section 9) |
| Logging | Built-in Next/Payload logs + Logtail or Axiom | Whatever's cheapest; just make sure ingest is searchable |
| Error reporting | Sentry | Standard |

---

## 5. Data model (Payload collections)

All collections are TypeScript-defined Payload collections. Field types reference Payload's built-in field set.

### 5.1 `users`
Standard Payload auth collection. Extra fields:

- `role` (select: admin / operator / viewer)
- `mfa_enabled` (checkbox)
- `last_login_at` (date, readOnly, hook-managed)

### 5.2 `sites`
The 50 (and growing) sites in the network. One row per active or retired site.

- `domain` (text, required, unique)
- `status` (select: active / standby / paused / retired / failed_over)
- `niche` (text)
- `niche_group` (select: geo / payment-method / game-category / bonus-type / player-segment / adjacent)
- `market` (text — short code like "US", "US-PA", "UK", "ROW")
- `tier` (number 1–5 — the link-building tier this site sits in)
- `pinned` (checkbox — surfaces it in the 9-card overview rotation)
- `launched_at` (date)
- `successor_of` (relationship → sites, optional — points back at the original site if this is a failover replacement)
- `standby_for` (relationship → sites, optional — points at the site this one is on standby for)
- `hosting_provider` (text — bulletproof provider, e.g. "Njal.la / FlokiNet")
- `notes` (richText)
- `external_ids` (group):
  - `gsc_property` (text — verified GSC property URL, e.g. `sc-domain:crypto-casinos-us.com`)
  - `ga4_property_id` (text)
  - `subaffiliate_tracking_id` (text — the identifier under the single MRKTplays sub-affiliate account)

### 5.3 `site_metrics_daily`
Daily metric snapshot per site. One row per (site, date). This is the table that powers all charts and KPI tiles.

- `site` (relationship → sites, required, indexed)
- `date` (date, required, indexed; together with `site`, unique)
- `clicks` (number)
- `impressions` (number)
- `ctr` (number)
- `avg_position` (number)
- `indexed_pages` (number)
- `crawl_errors` (number)
- `sessions` (number)
- `engaged_sessions` (number)
- `affiliate_clicks` (number)
- `conversions` (number — FTDs)
- `revenue_eur` (number — attributed revenue in cents/€ — use integer cents for precision)
- `uptime_pct` (number)
- `lcp_ms`, `inp_ms`, `cls` (numbers — Core Web Vitals)
- `source_versions` (json — `{gsc: "2026-05-30T06:00Z", ga4: "...", attribution: "..."}` for traceability)

Indexes: `(site, date desc)` for fast time-series reads.

### 5.4 `link_placements`
The continuously maintained link registry. Every placement is a row, and this is the table that powers both the link-profile panel AND the failover redirect map.

- `site` (relationship → sites — the placement targets this site)
- `target_url` (text — page on our site being linked to)
- `source_domain` (text — where the link is placed)
- `source_url` (text — exact source URL)
- `anchor_text` (text)
- `tier` (number 1–5)
- `dr` (number — domain rating at time of placement)
- `placed_at` (date)
- `status` (select: live / lost / replaced / removed)
- `kind` (select: pr / press_release / niche_placement / link_insert / foundational / partnership / podcast)
- `cost_eur` (number — cost of placement, internal only)
- `verified_at` (date, readOnly — last time we crawled and confirmed it's still live)
- `notes` (richText)
- `redirect_replacement` (text — when a site fails over, the equivalent URL on the successor; this is what powers the chain-forward)

Index `source_domain` and `(site, placed_at desc)`.

### 5.5 `alerts`
Alert *instances* (events). Not configurations.

- `site` (relationship → sites)
- `kind` (select: indexation_drop / ranking_collapse / manual_action / traffic_anomaly / link_velocity / uptime / cwv)
- `severity` (select: info / warn / critical)
- `status` (select: open / acknowledged / resolved / suppressed)
- `triggered_at` (date)
- `acknowledged_at` (date)
- `acknowledged_by` (relationship → users)
- `resolved_at` (date)
- `signal` (json — the raw data that triggered the alert)
- `note` (richText — incident commentary)

### 5.6 `alert_configs`
Per-(site, kind) thresholds. Global defaults exist at the network level (see `network_defaults` global).

- `site` (relationship → sites, optional — null means "global override per kind")
- `kind` (select, same list as `alerts.kind`)
- `enabled` (checkbox)
- `threshold` (json — kind-specific shape, e.g. `{drop_pct: 15, window_days: 7}` for indexation_drop)

### 5.7 `incidents`
Higher-level event records. An incident can group multiple alerts and is the artifact a post-mortem attaches to.

- `site` (relationship → sites)
- `title` (text)
- `started_at` (date)
- `resolved_at` (date)
- `outcome` (select: recovered_in_place / partial_recovery / failed_over / written_off)
- `summary` (richText)
- `linked_alerts` (relationship → alerts, hasMany)
- `actions_taken` (array of {when, by, action})
- `post_mortem` (richText)

### 5.8 `content_events`
Lightweight log of content-pipeline activity per site. Used to populate the Content Pipeline panel.

- `site` (relationship → sites)
- `kind` (select: generated / updated / pruned / editorial_published)
- `count` (number — bulk events store the count; individual events use 1)
- `at` (date)
- `template` (text, optional)
- `note` (text)

### 5.9 `failover_runs`
Audit log of failover executions. Created when a site is moved to its successor.

- `from_site` (relationship → sites)
- `to_site` (relationship → sites)
- `triggered_at` (date)
- `triggered_by` (relationship → users)
- `reason` (richText)
- `redirect_map_snapshot` (json — the link_placements rows used, frozen at failover time)
- `completed_at` (date)

### 5.10 Globals

#### `network_defaults`
- Default alert thresholds per kind
- Default content-refresh cadence
- Default link velocity bands

#### `branding`
- `product_name` (text, default: "Atastic")
- `customer_tag` (text — what shows in the top bar, e.g. "Cat Media · Managed Network")
- `primary_color`, `dark_color`, `soft_color` (text — hex codes)
- `logo_initials` (text, default: "AT")

---

## 6. Integrations (data ingestion)

All ingestion runs as scheduled jobs in the Payload jobs queue.

### 6.1 Google Search Console
- Library: `googleapis` (official Google API client)
- Auth: service account with delegated access OR OAuth refresh token per environment
- Each site's `external_ids.gsc_property` identifies which GSC property to pull from
- Pull: daily metrics (clicks, impressions, ctr, position), top queries, top pages
- Schedule: every 6 hours (GSC data lag is ~2 days anyway)
- Write to `site_metrics_daily`

### 6.2 Google Analytics 4
- Library: `@google-analytics/data`
- Auth: same service account if possible
- Pull: sessions, engaged sessions, conversions, revenue (via custom event), source/medium
- Schedule: every 3 hours
- Write to `site_metrics_daily`

### 6.3 Sub-affiliate attribution (MRKTplays or equivalent)
- Source: TBD — depends on customer integration. Will likely be one of:
  - CSV/SFTP drop (most common in iGaming)
  - Direct API access if exposed
- Map by `subaffiliate_tracking_id` → `site`
- Pull: conversions, revenue per identifier per day
- Schedule: daily
- Write to `site_metrics_daily` (`conversions`, `revenue_eur`)
- **Open question:** confirm the integration mechanism with the customer before this is built — stub with a CSV importer for development

### 6.4 WildBridge link registry
- Internal — sits inside Payload as the `link_placements` collection
- No external ingestion needed; placements are entered by operators or piped in from outreach tooling later
- Verification job: weekly crawl of `source_url` for each `status: live` placement, mark as `lost` if the link is gone

### 6.5 Uptime / Core Web Vitals
- Uptime: UptimeRobot or BetterStack API
- CWV: CrUX API or PageSpeed Insights API
- Schedule: hourly for uptime, daily for CWV
- Write to `site_metrics_daily`

### 6.6 Manual action signal
- GSC manual-action endpoint is part of the standard GSC API surface
- Schedule: hourly check
- If new manual action: create a `critical` alert, optionally auto-create an `incident`

---

## 7. Background jobs

All defined as Payload jobs. Use the built-in scheduler.

| Job | Schedule | What it does |
|-----|----------|--------------|
| `ingest_gsc_daily` | every 6h | Pull per-site GSC metrics for all `active` sites |
| `ingest_ga4_daily` | every 3h | Pull per-site GA4 metrics |
| `ingest_attribution_daily` | daily 04:00 UTC | Pull or import sub-affiliate attribution |
| `ingest_uptime_hourly` | hourly | Pull uptime metrics |
| `ingest_cwv_daily` | daily 05:00 UTC | Pull CWV |
| `check_manual_actions` | hourly | Poll GSC for new manual actions |
| `evaluate_alerts` | every 15 min | Run threshold checks against latest `site_metrics_daily`, create `alerts` rows when triggered |
| `verify_link_placements` | weekly | Crawl `source_url` of live placements, mark lost links |
| `nightly_health_summary` | daily 07:00 customer-local | Build and email a 1-page summary to subscribed users |

Each job is idempotent. Each writes a job-run record (Payload v3 has this built in).

---

## 8. Frontend architecture

The default Payload admin UI is collection-based and not designed to be the customer-facing dashboard. We build the dashboard as **custom Next.js pages** in the same project, auth-gated through Payload.

### 8.1 Routes

| Route | Page | Source mockup |
|-------|------|---------------|
| `/login` | Login | n/a (Payload default form, styled) |
| `/` | Network overview | `dashboard_mockup.html` |
| `/sites` | All-sites table view (paginated past the 9-card grid) | derivative of `dashboard_mockup.html` |
| `/sites/[domain]` | Site detail | `dashboard_site_detail_mockup.html` |
| `/sites/[domain]/incidents` | Incident history for the site | new |
| `/sites/[domain]/links` | Full link registry for the site | new |
| `/alerts` | Network-wide alerts feed | new |
| `/reports` | Generated reports / exports | new |
| `/admin/*` | Payload admin UI (collections, users, settings) | Payload default |

### 8.2 Auth gating
Use Payload's `req.user` in server components and middleware to redirect unauthenticated users to `/login`. Role-based UI: `viewer` doesn't see Edit / acknowledge buttons.

### 8.3 Components to build

- `<SiteCard />` — the 9-card grid cell (matches the network mockup)
- `<KPI />` — summary tile with sparkline + delta
- `<Sparkline />` — small inline SVG (already in the mockups, can be lifted)
- `<TimeSeriesChart />` — larger chart for the site detail (use the chosen chart library)
- `<TierBreakdownBar />` — the stacked horizontal bar in the link panel
- `<Funnel />` — the commercial funnel
- `<IncidentTimeline />` — the vertical event timeline
- `<AlertBadge />` — small chip with severity coloring
- `<HealthDot />` — colored dot with label

The HTML mockups can be ported component-for-component; the design tokens are already there at the top of each file (`:root` block).

### 8.4 Design tokens (carry over from mockups)
```
--brand:        #2E75B6
--brand-dark:   #1F4E79
--brand-soft:   #EAF1F7
--good:         #15803D
--warn:         #B45309
--bad:          #B91C1C
--tier1:        #6D28D9
--tier2:        #2563EB
--tier3:        #0891B2
--tier4:        #0F766E
--tier5:        #4B5563
```

These can be reskinned per customer via the `branding` global without code changes.

---

## 9. The "nine sites" rotation logic

The default landing view shows nine sites, not the full 50. The selection is:

1. Any site with an active `critical` alert (capped at 4 slots)
2. Any site pinned by the viewing user
3. Top movers by week-on-week click delta (positive or negative)
4. Fill remaining slots with tier-1 sites by revenue contribution

Pagination through the rest of the network is straightforward; the user can also switch to the all-sites view (`/sites`) for an unranked table.

Implement as a server-side ranking query that returns the 9 site IDs to render, with a tiebreaker on `pinned` then `tier` then `updated_at`.

---

## 10. Failover flow

When an `operator` triggers a failover (or it's triggered automatically by a `critical` manual-action alert and Catena has opted-in to auto-failover):

1. Create a `failover_runs` row in `triggered` state
2. Snapshot the current `link_placements` for the failed site into `redirect_map_snapshot`
3. For each placement, compute the equivalent URL on the successor (default rule: same path; configurable per placement via `redirect_replacement`)
4. Apply the redirect map at the infrastructure layer (this is outside Payload — issue API calls to whatever edge router/CDN is in use)
5. Flip `from_site.status` to `failed_over` and `to_site.status` to `active`, set `successor_of` on the new site
6. Continue link-building activity, now targeting the new site
7. Background job continues outreach to highest-tier publishers to update links at source rather than relying on the 301
8. Mark `failover_runs.completed_at` once the redirect map is fully applied

---

## 11. MVP scope

Phase 1 (8–10 weeks of build, single dev):

- [x] Auth + roles + admin shell (Payload defaults, lightly themed)
- [x] `sites`, `site_metrics_daily`, `link_placements`, `alerts`, `alert_configs` collections
- [x] GSC + GA4 ingestion jobs
- [x] Alert evaluation job for: indexation_drop, ranking_collapse, manual_action, traffic_anomaly
- [x] Network overview page (`/`)
- [x] Site detail page (`/sites/[domain]`)
- [x] Manual incident creation
- [x] Read-only sub-affiliate attribution via CSV import (until live integration confirmed)
- [x] Branding global wired to top bar / page chrome

Out of scope for Phase 1 (parked for Phase 2):

- Automatic failover execution (operator runs it manually for now, with the failover record created retroactively)
- Link velocity alert (requires a stable baseline first)
- Generated reports / exports endpoint
- Public API for the customer's BI tools
- Nightly email summaries
- IP allowlisting on roles

---

## 12. Repo layout (suggested)

```
atastic/
├── src/
│   ├── app/                     # Next.js app router
│   │   ├── (dashboard)/         # custom dashboard pages (auth-gated)
│   │   │   ├── page.tsx         # network overview
│   │   │   ├── sites/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [domain]/page.tsx
│   │   │   └── alerts/page.tsx
│   │   ├── admin/               # Payload admin UI (served by Payload)
│   │   └── api/                 # Payload's REST + GraphQL endpoints
│   ├── collections/             # Payload collection definitions
│   │   ├── Users.ts
│   │   ├── Sites.ts
│   │   ├── SiteMetricsDaily.ts
│   │   ├── LinkPlacements.ts
│   │   ├── Alerts.ts
│   │   ├── AlertConfigs.ts
│   │   ├── Incidents.ts
│   │   ├── ContentEvents.ts
│   │   └── FailoverRuns.ts
│   ├── globals/
│   │   ├── NetworkDefaults.ts
│   │   └── Branding.ts
│   ├── jobs/
│   │   ├── ingest-gsc.ts
│   │   ├── ingest-ga4.ts
│   │   ├── ingest-attribution.ts
│   │   ├── evaluate-alerts.ts
│   │   └── verify-link-placements.ts
│   ├── components/              # shared React components
│   ├── lib/                     # integrations, helpers, db utilities
│   └── payload.config.ts
├── public/
└── package.json
```

---

## 13. Open questions (need answers before / during build)

1. **Sub-affiliate attribution integration** — CSV/SFTP drop, direct API, or other? Determines how `ingest_attribution_daily` is built. Default to CSV importer for MVP.
2. **Hosting region** — Catena likely prefers EU hosting for the app itself (GDPR posture); bulletproof hosting for the network sites themselves is a separate concern. Confirm.
3. **Backup posture** — daily PG snapshots are baseline; do we need point-in-time recovery? Probably yes for the metrics tables.
4. **Email delivery** — Resend? Postmark? Pick before nightly summaries are built.
5. **Domain for the app itself** — `atastic.io`? `app.atastic.io`? Confirm before TLS / cookie domain decisions.
6. **Single-tenant vs. multi-tenant** — first deployment is single-customer; do we want the data model to be tenant-aware from day one (cheap to add `tenant_id` early, painful later)?
7. **Audit log retention** — how long do we keep `failover_runs`, `incidents`, raw `signal` payloads? Suggest: forever for incidents and failovers, 180 days for alert signals.
8. **Customer-side viewer access** — do customer users sign in to Atastic directly, or do we proxy them in via SAML/SSO from their identity provider? Latter is harder, more enterprise-friendly.

---

## 14. Reference artifacts

In this folder:

- `Catena_Media_Supplier_Proposal_v0.1.docx` — the proposal that describes the operating model this dashboard supports. Sections 7 (Operations Dashboard) and 8.1 (Failover model) are the most directly relevant.
- `dashboard_mockup.html` — network overview reference
- `dashboard_site_detail_mockup.html` — site detail reference

The mockups are the source of truth for visual design; the proposal is the source of truth for product intent.
