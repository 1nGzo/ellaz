# Fork service configuration

This fork defaults to local operation. The older deployment/cloud documents
record upstream history; their project IDs, accounts and domains are not this
fork's deployment instructions.

- `site.config.json`: canonical, Open Graph and generated share/embed URLs use
  `http://localhost:5180` (the existing Vite dev port). Set `origin` to your own
  site before publishing. `gaMeasurementId` and `indexNowKey` are blank; no GA
  loader or IndexNow ownership file is emitted by default.
- Firebase: `.firebaserc` has no default project. Set both public
  `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID` for your own project and
  rebuild. Blank or partial configuration sends no cloud requests, including
  with a cached auth identity. Backup/restore, cloud leaderboards and report
  submission are unavailable until configured. Local saves remain in the
  browser's existing localStorage, scoped to the current origin.
- PostHog: no default key; dev events stay in the console and production events
  are discarded. Existing opt-in environment variables are unchanged.
- Inherited Hostinger, GitHub Pages, Cloudflare deployments and remote monitoring
  jobs require repository variable `ENABLE_CLOUD_WORKFLOWS=true`. Leave it unset
  until every target, account, secret and live-check URL in the chosen workflow
  has been reviewed for this fork. Existing deployment recipes remain dormant.
- Firebase probes require explicit VITE Firebase variables. Rules/index releases
  require `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT`. Report pulling
  requires `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT` (also for its live
  `--control` mode), and defaults to this fork's GitHub repository.
  IndexNow submission requires `INDEXNOW_HOST` and `INDEXNOW_KEY`; set the same
  key in `site.config.json`. None of these commands inherit upstream credentials.

Existing UI copy and historical docs mentioning the upstream brand/domain are
unchanged. They do not configure Firebase or analytics. Reconnecting services
requires configuring and validating a project you control; this change does
not provision cloud resources or migrate any upstream data.
