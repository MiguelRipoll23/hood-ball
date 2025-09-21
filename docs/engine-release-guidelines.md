# Engine Release Guidelines

This guide outlines how the reusable engine package is versioned, validated, and integrated back into Hood Ball once packaging is complete.

## Release cadence
- Cut engine releases at the end of each sprint after game QA verifies the latest integrations.
- Use semantic prerelease tags (for example 0.2.0-next.1) until the API stabilises; promote to stable tags only after two consecutive sprints without breaking changes.
- Reserve hotfix versions for critical regressions discovered in production builds of the game.

## Versioning and dependency workflow
1. Start from a clean working tree and confirm all boundary checks pass: `npm run verify:deps`, `npm run lint`, `npm run smoke:engine`, and `npm run smoke:engine-package`.
2. Bump the version in `packages/engine/package.json` following semantic versioning. Commit the change with the release notes stub in `packages/engine/CHANGELOG.md`.
3. Run `npm run build:engine` to produce the distributable. If publishing, execute `npm pack` inside `packages/engine` and stash the tarball for the next step.
4. In the Hood Ball workspace, install the freshly built package tarball (or reference) using the workspace protocol so the game consumes the exact artifact it will ship with.
5. Re-run the full verification suite (`npm run build`, `npm run smoke:engine`, and the game’s end-to-end checks) against the bumped dependency. Address any regressions before tagging.
6. Tag the release in git (`engine-vX.Y.Z`) and push both the tag and commits. If the release is a hotfix, also cherry-pick the change set into the active release branch before tagging.
7. Publish the engine package to the internal registry and update downstream applications by bumping their `@hood-ball/engine` dependency. Document the change in `docs/migration-notes.md` when it requires consumer action.

## Sample integration
- Maintain the minimal playground under `samples/minimal-engine-game` to showcase container bootstrap, loop configuration, and dependency resolution in isolation.
- Keep the sample free of Hood Ball assets so downstream teams can reuse it as a template. It links the local engine workspace via a `file:` dependency.
- Update the sample whenever a contract or bootstrap signature changes and re-run both smoke scripts so packaging and consumer scenarios stay green.

## CI compatibility smoke build
- Run `npm run smoke:engine-package` to build the engine workspace, pack the distributable, install it into a throw-away consumer project, and execute its harness. The command exercises the exact tarball that CI will publish.
- Wire this script into CI release pipelines so the game is always validated against the packaged artifact instead of source imports.

## Roll-back procedures
- If the game build fails against a new engine version, pin the workspace dependency back to the previous tag and re-run smoke:engine before merging.
- For published packages, yank the broken version from the internal registry and document the regression in the release notes.
- Capture post-mortem notes in docs/adr so future refactors avoid the same class of issues.

## Automation follow-up
- Add a CI job that packages the engine, installs it into the game workspace, and runs the smoke and build scripts before tagging a release.
- Generate a changelog automatically from conventional commits in the engine workspace to ease release notes.
- Monitor dependency graph checks to ensure no engine module accidentially imports from src/game after packaging.
