# Repository structure

| Folder | Purpose | Where to edit |
| --- | --- | --- |
| `content/` | Text and front matter for live pages | Sveltia, or Markdown in GitHub |
| `content/sites/` | Location and community research | Sveltia Sites |
| `content/exhibition/` | Audio pages; public URLs are `/audio/` | Sveltia Audio |
| `layouts/` | Active Hugo HTML templates | GitHub code editor |
| `layouts/partials/` | Shared header, footer, navigation and galleries | GitHub code editor |
| `layouts/shortcodes/` | Reusable embeds inserted in content | GitHub code editor |
| `static/admin/` | Sveltia loader and current configuration | GitHub code editor |
| `static/manage/` | Editing dashboard and generated file index | GitHub code editor |
| `static/tools/` | Standalone Studio and QR tools | Studio for creating embeds; GitHub for tool code |
| `static/css/` | Shared styles and fonts declarations | GitHub code editor |
| `static/JS/` | Shared browser behaviour | GitHub code editor |
| `static/images/` | Public image assets | Sveltia media browser |
| `static/downloads/` | Public PDF assets | GitHub upload |
| `static/data/` | Structured data, including the quote deck | Sveltia Quotes, or GitHub |
| `scripts/` | Maintenance scripts | GitHub code editor |
| `archive/` | Previous templates, config and reference files | Reference only; Hugo does not publish this folder |
| `docs/` | Maintenance and editing instructions | GitHub code editor |

## Naming and compatibility

Keep the existing `static/JS/` capitalisation. URLs are case-sensitive. Keep public image names, content slugs and existing aliases unless performing an explicit URL migration.

The `exhibition` section deliberately publishes under `/audio/`; `hugo.toml` defines this. The old `/exhibition/` links are maintained through front matter aliases. This folder is not a duplicate audio website.

Hugo copies everything in `static/` to the live site. Do not place new backups there. Save reference copies under `archive/`, or use Git history. Existing `studio_old.html` and `studio_backup.html` remain in place to preserve any external links; they are not indexed as active editors. `press_old.md` is also retained pending an explicit redirect migration.

## Layout conventions

Ordinary pages use `layouts/_default/baseof.html`; some exhibition-facing pages intentionally have standalone HTML shells. Avoid switching them wholesale to the normal shell: that can introduce unwanted navigation or change installation behaviour.

Share components where their behaviour is identical. `core-nav.html` owns navigation markup; `static/css/core-nav.css` owns its styling. Page-specific styles remain with their current templates in this pass.

When adding or removing an active file, regenerate `static/manage/files.json` with `python3 scripts/build_admin_index.py`. The dashboard does not require a database, token or custom authentication service.
