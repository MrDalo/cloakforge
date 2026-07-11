# Release Process

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (`v2.0.0`) — Breaking changes (API contract, data schema)
- **MINOR** (`v1.1.0`) — New features, backward compatible
- **PATCH** (`v1.0.1`) — Bug fixes, backward compatible

## Release Workflow

```bash
# 1. Create release branch from develop
git checkout develop && git pull origin develop
git checkout -b release/v1.4.0

# 2. Bump version in package.json
npm version 1.4.0 --no-git-tag-version

# 3. Update CHANGELOG (if maintained)
# Add new version section at top

# 4. Commit version bump
git commit -m "chore(release): bump version to 1.4.0"

# 5. PR to master, squash merge
# After merge:

# 6. Tag the release on master
git checkout master && git pull origin master
git tag -a v1.4.0 -m "Release v1.4.0"
git push origin v1.4.0

# 7. Merge master back to develop
git checkout develop && git merge master
git push origin develop
```

## Tagging Convention

```
v{MAJOR}.{MINOR}.{PATCH}
v1.4.0       ← standard release
v1.4.0-rc.1  ← release candidate
v1.4.0-beta.1 ← beta
```

## Hotfix Release

```bash
# Branch from master
git checkout master && git checkout -b hotfix/v1.3.1

# Fix + commit
git commit -m "fix(api): handle malformed RPC response"

# Bump patch version
npm version 1.3.1 --no-git-tag-version
git commit -m "chore(release): bump version to 1.3.1"

# PR to master → merge → tag
git tag -a v1.3.1 -m "Hotfix v1.3.1"
git push origin v1.3.1

# Backport to develop
git checkout develop && git merge master
git push origin develop
```
