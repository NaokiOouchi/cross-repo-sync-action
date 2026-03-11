# Changelog

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
