# Editing the website

Start at `/manage/`. It provides three entry points and a searchable active-file index.

## Text, photographs and records

Use Sveltia at `/admin/`. The CMS edits the collections defined in `static/admin/config.yml`. It does not currently edit Hugo HTML templates. The existing GitHub sign-in flow is unchanged.

Raw Markdown and rich text are two views of the same content, not separate versions of the website. Use raw mode when preserving an existing shortcode or embed. The working audio playlist system remains as it is.

## HTML, CSS and JavaScript

Use **Code** in the dashboard, or an **Edit HTML** link beside a page type. These open GitHub's editors. HTML under `layouts/` contains Hugo template expressions as well as HTML; preserve both.

Create a branch for layout or behaviour changes. Build locally with the same Hugo version used in `.github/workflows/hugo.yml`. Commit the change, review the diff and merge only when the checks pass. A commit to `main` publishes automatically.

The file list includes the standalone tools, so their HTML can be edited too. The existing Studio interface creates embeds; it does not edit all website templates.

## Finding the right file

| Change | File or editor |
| --- | --- |
| Homepage introduction | Sveltia Homepage / `content/_index.md` |
| Site text and galleries | Sveltia Sites / `content/sites/` |
| Site page structure | `layouts/_default/single.html` |
| Main website shell | `layouts/_default/baseof.html` |
| Audio page structure | `layouts/exhibition/single.html` |
| News page structure | `layouts/news/single.html` |
| Installation page structure | `layouts/installs/single.html` |
| Shared standalone navigation | `layouts/partials/core-nav.html` and `static/css/core-nav.css` |
| Global colours, fonts and spacing | `static/css/style.css` |
| CMS fields and collections | `static/admin/config.yml` |
| Audio / gallery browser behaviour | `static/JS/supercharged.js` and `static/JS/gallery.js` |

Some pages contain their own CSS in the HTML template. Changing the global stylesheet may not change an overridden page style. Consult the template before adding another override.

## Downloads and media

Files uploaded under `static/images/` are served at `/images/`; files in `static/downloads/` are served at `/downloads/`. Renaming a file can break a Markdown link or printed QR code. Search references before moving it.

## Rolling back

Use GitHub's revert operation on the change's pull request or commit. Do not restore the whole repository over newer content. Previous reference files are in `archive/`; public Studio backup paths are retained for compatibility.

## What this maintenance pass changes

The management dashboard, active-file index, repo documentation, backup-template locations and shared navigation stylesheet. It does not change page copy, routes, the CMS schema, audio/gallery behaviour or the intentional exhibition layouts.
