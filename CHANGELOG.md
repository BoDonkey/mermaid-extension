# Changelog

## 2.1.0 - 2026-07-01

### Added

* Added optional `initBlock` support for applying shared Mermaid configuration to every diagram at render time.
* Added optional widget captions.
* Render diagrams with semantic `<figure>` markup, including `.mermaid-widget`, `.mermaid-widget__canvas`, and `.mermaid-widget__caption` classes for site styling.
* Added an Astro `initBlock` prop so Astro frontends can pass the same shared Mermaid configuration through a wrapper component.
* Added lint and smoke-test tooling.

### Changed

* Updated frontend Mermaid CDN rendering from Mermaid 10 to Mermaid 11 to match the package dependency.
* Included README images in the published package file list.
* Restored README screenshot assets.

### Fixed

* Fixed the Apostrophe editor input so it imports Mermaid instead of referencing an undefined global.
* Fixed the Apostrophe editor preview to load Mermaid from the CDN instead of bundling Mermaid's lazy ESM diagram chunks into the admin UI.
* Fixed Astro renderer startup so diagrams initialize after DOM readiness and after Astro page-load events.
* Fixed package verification so `npm test` now runs lint plus smoke tests.

### Notes

* Existing saved widgets continue to render. Projects with CSS that targets the old direct wrapper shape, such as `[data-mermaid-widget] > .mermaid`, may need to update selectors for the new figure/canvas markup.

## 1.0.0

* initial release
