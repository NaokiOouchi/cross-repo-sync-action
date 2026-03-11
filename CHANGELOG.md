# Changelog

## [1.3.0] - 2026-03-11

### Changed

- Migrate runtime from Node.js 20 to Node.js 24

### Fixed

- Fix 400 error when directory path has trailing slash in GitHub API calls

## [1.2.1] - 2026-03-11

### Added

- Japanese README (README.ja.md)

### Fixed

- Handle missing source directory gracefully for delete sync (returns empty instead of ENOENT)

## [1.2.0] - 2026-03-11

### Fixed

- Security hardening: path traversal prevention, YAML safe loading, Markdown sanitization
- Code quality improvements from code review

## [1.1.1] - 2026-03-11

### Fixed

- Avoid redundant commits when sync branch is already up to date (idempotency fix)

## [1.1.0] - 2026-03-11

### Added

- Directory sync support (`src` ending with `/` syncs all files recursively)
- `delete` option to remove orphaned files in target directories
- GitHub App authentication documentation

## [1.0.0] - 2026-03-11

### Added

- Initial release
- Sync individual files from source repo to multiple target repos
- Automatic PR creation and update (idempotent)
- Dry-run mode
- Customizable PR title and commit message prefixes
- Zod-based config validation
