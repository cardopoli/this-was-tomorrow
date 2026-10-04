# This Was Tomorrow

Hugo website for Enrico Policardo's photographic and audio research into community-led housing.

## Editing

Start at [the management dashboard](https://thiswastomorrow.co.uk/manage/).

- **Content:** [Sveltia CMS](https://thiswastomorrow.co.uk/admin/)
- **Embeds:** [Studio](https://thiswastomorrow.co.uk/tools/studio.html)
- **HTML, CSS and JavaScript:** [GitHub browser editor](https://github.dev/cardopoli/this-was-tomorrow)
- **Deployment:** [GitHub Actions](https://github.com/cardopoli/this-was-tomorrow/actions)

The dashboard links page content to the templates that render it. Read [editing.md](docs/editing.md) and [structure.md](docs/structure.md) before changing the implementation.

## Local build

Use Hugo **0.160.1 extended**, matching the deployment workflow.

```sh
python3 scripts/build_admin_index.py
hugo server --disableFastRender
```

Production build:

```sh
hugo --gc --minify
```

`main` deploys to the live website. Use a branch for code changes. Compare the generated output before merging changes to shared templates. Never rename public paths or remove aliases used by printed QR codes without checking them.
