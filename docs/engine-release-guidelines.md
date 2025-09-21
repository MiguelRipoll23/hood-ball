# Engine Release Guidelines

This guide outlines how the reusable engine package is versioned, validated, and integrated back into Hood Ball once packaging is complete.

## Release cadence
- Cut engine releases at the end of each sprint after game QA verifies the latest integrations.
- Use semantic prerelease tags (for example 0.2.0-next.1) until the API stabilises; promote to stable tags only after two consecutive sprints without breaking changes.
- Reserve hotfix versions for critical regressions discovered in production builds of the game.

## Sample integration
- Maintain a minimal playground scene under packages/engine/samples to showcase container bootstrap, scene registration, and event dispatch in isolation.
- Keep the sample free of Hood Ball assets so downstream teams can reuse it as a template.
- Update the sample whenever a contract or bootstrap signature changes and run it as part of the smoke:engine script.

## Roll-back procedures
- If the game build fails against a new engine version, pin the workspace dependency back to the previous tag and re-run smoke:engine before merging.
- For published packages, yank the broken version from the internal registry and document the regression in the release notes.
- Capture post-mortem notes in docs/adr so future refactors avoid the same class of issues.

## Automation follow-up
- Add a CI job that packages the engine, installs it into the game workspace, and runs the smoke and build scripts before tagging a release.
- Generate a changelog automatically from conventional commits in the engine workspace to ease release notes.
- Monitor dependency graph checks to ensure no engine module accidentially imports from src/game after packaging.
