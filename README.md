# rost-implementation-skill

Status: pre-release. Do not install from this repository until a signed release tag is published. Release integrity is verified against a CLI-held signer trust root before any manifest or checksum is used.

This is the public Skill that turns Claude Code, Codex, Cursor, or a compatible agent into a mode-aware ROST implementer for a company.

## Install

Run the matching command in the agent's terminal. The CLI fetches, verifies, and installs the Skill.

Claude Code:

```bash
npx @rosthq/cli@latest skills install-implementation --client claude-code
```

Codex:

```bash
npx @rosthq/cli@latest skills install-implementation --client codex
```

Cursor:

```bash
npx @rosthq/cli@latest skills install-implementation --client cursor
```

## What the installer verifies

1. The release tag's SSH signature against the signer trust root compiled into the CLI.
2. The repository owner and repository name match the manifest.
3. The manifest checksum.
4. Per-file checksums against the manifest.
5. The installed CLI's supported protocol range.

The signer trust root is `SHA256:ziSyU9vhGi0Q3GaeePB1R6BI3GqXutLhepnF/4Hx4rY`. The private signing key is not stored in this repository. Key rotation is delivered through an explicit CLI update, not through package content.

## Skill entrypoint

Once installed, the agent loads `SKILL.md` from this package. See [SKILL.md](SKILL.md) for the full orchestration.

## References

- [SKILL.md](SKILL.md) — compact orchestrator with the canonical fifteen-step composite flow
- [references/execution-loop.md](references/execution-loop.md) — composite execution loop (source ingest, one setup approval, receipt verification, rehearsal, one activation approval, completion)
- [references/mode-behavior.md](references/mode-behavior.md) — regular implementation-bootstrap and Full Operator mode behavior
- [references/oauth-handoff.md](references/oauth-handoff.md) — OAuth and external-provider handoff
- [references/conversation-grant-handoff.md](references/conversation-grant-handoff.md) — external-effect handoff status
- [references/final-report.md](references/final-report.md) — mandatory final implementation report

## Validation

- `node scripts/validate-fixtures.mjs` — validates the deterministic flow fixtures in `fixtures/` (positive fixtures must validate; negative fixtures, including the retired multi-gate onboarding recipe, must be rejected) and checks that SKILL.md still carries the canonical steps and hard rules.
- `node scripts/update-manifest.mjs` — regenerates the per-file sha256 entries in `skill-manifest.json` after any content change.

CI (`.github/workflows/validate.yml`) runs the fixture validation and verifies the manifest checksums; regeneration is a local step before committing. The minimum compatible CLI version has a single authoritative location: `protocol.minCli` in `skill-manifest.json`.

## Manual fallback

If the CLI installer cannot run, the exact step is to install or upgrade `@rosthq/cli`:

```bash
npx @rosthq/cli@latest --version
```

Do not hand-copy files from this repository, because hand-copied content is unverified and will not carry a `.rost-skill-release.json` provenance marker.
