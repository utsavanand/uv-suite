# Changelog

Newest first. Each entry says what changed for someone installing the kit, not every commit.

## Unreleased (branch kit/knowledge-cleanup, 2026-11-25)

The component-by-component review against the DuckTerm skill-kit calibration (15/20 → 17/20).

- Manifests: `skill-kit.toml`, `.fast` and `.docs` are now `metaharness.toml`, `metaharness.fast.toml` and `metaharness.docs.toml`, the name DuckTerm reads first since its MetaHarness rename (2026-11-26); the old name still loads with a rename warning.
- Knowledge: ten files became five, named by what the agent does with them: agent-working-rules (always on, 2.6 KB), acts-build-planning, danger-zones, code-slop-rules (on demand), doc-slop-rules (docs files). Always-on text per harness 13.3 KB → 4.7 KB.
- Skills: twelve became nine plus `uvs-implement`. Removed prototype, session, help, lite. Renamed understand → map-codebase, architect → plan, investigate → debug, commit → ship. Every shell context block is a plain instruction, so the skills work on Codex, Copilot and OpenCode as well as Claude Code. Review and QA keep their long reference material in `reference/` beside each SKILL.md.
- Agents: eight became seven; cartographer → codebase-mapper; debugging no longer runs under the read-only reviewer; review specialists run under the reviewer; Graphify and the Playwright MCP server are declared tools.
- Hooks: eight became one, `block_destructive`.
- Permissions: duplicates dropped, `chmod *` → `chmod +x *`, the stance written in the README.
- Flows: `pr-review` (a PR), `build` (a spec), `qa` (an app URL), `ship` (spec and URL, end to end through commit and PR).
- Settings named for what they set; personas removed; `uvs-ship` held by the release role alone.

## 0.34.0 (2026-06-09)

- Security: Watchtower RCE and CSRF fixed; blocking I/O offloaded; filesystem-write boundary hardened, with a pytest suite.
- Skills prefixed `uvs-` for discoverability.
- README and CONTRIBUTING brought back in line with the code.

## 0.33.0 (2026-06-08)

- `/confirm` removed.

## 0.32.0 (2026-06-06)

- First tagged release of the kit in this repository.
