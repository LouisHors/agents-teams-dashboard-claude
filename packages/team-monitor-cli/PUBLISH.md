# Publishing Guide

## Preparation

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run tests
4. Commit changes

## Publishing to npm

```bash
# Login to npm (if not already logged in)
npm login

# Publish
npm publish

# Or publish as beta
npm publish --tag beta
```

## Post-Publish

1. Create GitHub release
2. Update documentation
3. Announce on social media

## Versioning

Follow semantic versioning:
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes
