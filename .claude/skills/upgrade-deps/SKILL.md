---
name: upgrade-deps
description: Upgrade all npm dependencies across the monorepo to their latest versions. Use when the user asks to "upgrade dependencies", "update packages", "bump all deps to latest", or similar. Respects exact-pinned versions, handles major-version bumps explicitly, and verifies the upgrade by running type-check and tests before handing back.
---

# Upgrade all dependencies to latest

Goal: move every workspace's `dependencies` and `devDependencies` to the latest published version, then prove nothing broke. Do NOT blindly run `pnpm update --latest -r` and declare success — that's how silent breakage ships.

## Preconditions (check before doing anything)

1. **Clean git state.** Run `git status --porcelain`. If there are uncommitted changes, STOP and ask the user — upgrading rewrites `package.json` files and the lockfile, which will tangle with their in-progress work.
2. **Detect the package manager** from lockfiles at the repo root (in order of preference):
   - `pnpm-lock.yaml` → use `pnpm`
   - `yarn.lock` → use `yarn`
   - `package-lock.json` → use `npm`
   - If multiple lockfiles exist, ask which is authoritative before proceeding. For this repo specifically: `pnpm-lock.yaml` is authoritative.
3. **List pinned versions.** Grep all `package.json` files under `apps/*` and `packages/*` for dependency entries with NO leading `^` or `~` (exact pins). Report them to the user — these are intentional and must be preserved. Exact pins typically mean:
   - A fork or patched version is required (e.g. a modified `next` build — read `AGENTS.md` / `CLAUDE.md` for project context).
   - A known bug exists in a later version.
   - Reproducibility for infra reasons.
   Ask the user to confirm the list before continuing. Do NOT upgrade exact-pinned packages unless the user explicitly overrides.

## Plan the upgrade

4. **List outdated packages.** Run the package-manager's outdated command across workspaces:
   - pnpm: `pnpm outdated -r --format list`
   - npm: `npm outdated --workspaces --json`
   - yarn: `yarn outdated`
   Capture current → wanted → latest for every dependency.
5. **Classify bumps by semver:**
   - **Patch/minor**: safe to do together.
   - **Major**: each one is a potential breaking change. Surface them to the user as a list with links to the changelog when known (React, Next, TypeScript, Tailwind, Vite, etc.). Ask the user which majors to include. Do NOT bundle majors silently with patches.
6. **Show the plan.** Before touching anything, print:
   - Packages being upgraded (current → target).
   - Packages being skipped (pinned, or user-excluded majors).
   - Expected post-upgrade verification steps.
   Wait for user confirmation.

## Execute

7. **Upgrade only the approved set.** Prefer a single command that upgrades the allowed list; avoid `--latest -r` over everything because it ignores exact pins on some package managers.
   - pnpm: `pnpm update --latest --recursive <pkg1> <pkg2> ...` for the approved list. For the "all non-pinned, no majors" case, `pnpm update -r` (without `--latest`) respects ranges and is safer as a baseline.
   - npm: `npm install <pkg>@latest -w <workspace>` per package.
   - yarn (berry): `yarn up '<pkg>@latest'` (all workspaces) or `yarn workspace <ws> up <pkg>@latest`.
8. **Reinstall** if needed (pnpm usually handles this; for npm run `npm install`).
9. **Dedupe** when available: `pnpm dedupe`, `npm dedupe`. Only if it's a no-op or the user okays the resulting changes.

## Verify

Run these in order. If any fail, STOP and report — do not try to auto-fix dependency-induced breakage unless the user asks.

10. **Type-check every workspace** with a TypeScript config:
    - Find them: `apps/*/tsconfig.json`, `packages/*/tsconfig.json`.
    - Run: `cd <workspace> && npx tsc --noEmit` for each, OR use a monorepo script if one exists (e.g. `pnpm -r typecheck`).
    - Pre-existing errors: compare against a `tsc` run on the pre-upgrade commit (`git stash` + `tsc` + `git stash pop`) so you can distinguish *new* errors from legacy ones. Only NEW errors should block.
11. **Lint**: run the project's lint script if one exists.
12. **Unit tests**: run the project's test script if one exists. Playwright / e2e tests are usually too slow and environment-sensitive — skip unless the user asks.
13. **Build** at least one app end-to-end (`pnpm --filter <primary-app> build`) to catch issues that only surface at build time (webpack/next/vite plugin API changes).

## Report back

14. Produce a short summary:
    - Packages upgraded (old → new).
    - Packages intentionally skipped and why.
    - Verification results (typecheck OK, tests OK, build OK).
    - Anything that looked suspicious in release notes for the major bumps.
15. Do NOT commit. Leave the diff staged-or-unstaged per the user's preference and let them review.

## Rollback

If the user wants to abandon the upgrade:
```
git checkout -- package.json 'apps/*/package.json' 'packages/*/package.json' pnpm-lock.yaml
pnpm install
```
(Adapt the lockfile name per package manager.) Confirm with the user before running — this is destructive to their working tree.

## Gotchas specific to modern JS ecosystems

- **React 19 / Next 15+**: peer-dep constraints tighten every release. If `pnpm` complains about unmet peers, read the message — it's usually actionable (bump the companion package).
- **Tailwind v4**: the config format changed from v3. A major bump requires CSS-file migration, not just a version number.
- **Vite 5 → 6 / 7**: plugin API renames. Check each custom plugin.
- **TypeScript**: major bumps often tighten inference. Expect some new errors; don't suppress them with `any`, actually fix them.
- **ESLint 9**: flat-config is mandatory. If the repo still uses `.eslintrc.*`, the upgrade is not drop-in.
- **Modified forks**: if a package is pinned to an exact version and a note exists (e.g. `AGENTS.md` warns the fork differs from upstream), DO NOT upgrade it. Surface the warning back to the user.

## What NOT to do

- Do not use `npm-check-updates` / `ncu -u` blindly — it rewrites ranges without resolving peers.
- Do not pass `--force` or `--legacy-peer-deps` to escape peer conflicts. Fix the peer.
- Do not upgrade one package at a time across 30+ commits "for bisectability" unless asked — it's noise. One reviewable PR per logical group (patches, each major).
- Do not bump `node` engines or `packageManager` fields as part of this flow. That's a separate decision.
