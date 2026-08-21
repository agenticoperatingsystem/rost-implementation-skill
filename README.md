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

- [SKILL.md](SKILL.md) — compact orchestrator with the canonical sixteen-step composite flow
- [references/runner-setup.md](references/runner-setup.md) — the resumable runner setup lifecycle, its human actions, and what the plan submits
- [references/execution-loop.md](references/execution-loop.md) — composite execution loop (runner setup, source ingest, one setup approval, receipt verification, rehearsal, one optional launch approval, completion)
- [references/mode-behavior.md](references/mode-behavior.md) — regular implementation-bootstrap and Full Operator mode behavior
- [references/oauth-handoff.md](references/oauth-handoff.md) — OAuth and external-provider handoff
- [references/conversation-grant-handoff.md](references/conversation-grant-handoff.md) — external-effect handoff status
- [references/final-report.md](references/final-report.md) — mandatory final implementation report, including the later-launch actions

## Validation

- `node scripts/validate-fixtures.mjs` — validates the deterministic flow fixtures in `fixtures/`. Positive fixtures must validate; negative fixtures must be rejected **and must be rejected for the reason they declare in `rejected_because`**, so a fixture cannot pass while the rule it names goes unpinned. It also checks that SKILL.md still carries the canonical steps and hard rules, that `references/runner-setup.md` and `references/final-report.md` carry theirs, and that no retired claim (two required approvals; "there is no cloud fallback"; the launch marking onboarding complete) has crept back into the **seven agent-loaded files** — `SKILL.md` and the six `references/`. That reach is deliberate and is stated rather than left to be discovered: those are the files an implementing agent reads and acts on, so a retired claim surviving there is one that gets followed. `README.md` and `CHANGELOG.md` are permanently excluded because both have to QUOTE the retired wording in order to record that it was retired, and `scripts/` because it holds the patterns themselves. A new reference file must be added to `REFERENCE_FILES` in the validator or it sits outside this guard.
- `node scripts/update-manifest.mjs` — regenerates the per-file sha256 entries in `skill-manifest.json` after any content change.

CI (`.github/workflows/validate.yml`) runs the fixture validation and verifies the manifest checksums; regeneration is a local step before committing. The minimum compatible CLI version has a single authoritative location: `protocol.minCli` in `skill-manifest.json`.

## Fixtures

| Fixture | What it pins |
|---|---|
| `positive/canonical-flow.json` | the canonical sixteen-step flow, Runner-ready, with the optional launch taken |
| `positive/cloud-fallback.json` | a VISIBLE Cloud fallback under a Runner preference — a valid outcome, with its typed reason reported |
| `positive/aicos-only.json` | the setup approval alone: a complete operating company, agents left in draft, zero launch approvals |
| `negative/silent-cloud-fallback.json` | the same fallback, unreported. The one clause that differs is the silence |
| `negative/oauth-gated-live-signal.json` | a Signal submitted `live_verified` while its source is still behind an OAuth consent |
| `negative/multi-gate-recipe.json` | the retired per-Seat / per-Charter / per-agent recipe with a client-side approval loop |
| `negative/invites-and-external-send.json` | teammate invitations and an external communication |
| `negative/mutable-slug-skill-pin.json` | a published Skill referenced by mutable slug with no version ID or content hash |
| `negative/agent-enables-trusted-posture.json` | the agent turning the Trusted posture on instead of preparing the review and handing it over |

Every fixture must carry an `aicos_lane` block. "Do not hide a lane fallback" is
the strongest rule in this corpus and an optional field would make it evadable by
the cheapest possible move — omitting the block. Every negative must also declare
`rejected_because` and be rejected for THAT reason: a negative rejected for the
wrong reason looks green while the rule it names goes unpinned.

### What the corpus deliberately does not model

**A launch that was staged but never approved.** Steps 12 and 13 are all-or-
nothing: a fixture takes the launch and verifies it, or does neither. There is a
real intermediate state — the agent stages the launch, gives the owner the URL,
and the owner has not acted yet — and it is not representable here.

That is a chosen contract, not an oversight. A fixture describes a run's OUTCOME,
and "waiting for a human" is not an outcome; the honest resolutions are that the
owner approved (the canonical fixture) or that the run reported the pending URL
and stopped (the `aicos-only` shape, plus the pending approval named in the final
report). Modelling the in-between would require a third state on the pair and
would weaken the property the pair exists to enforce — that a run never claims a
launch it did not verify. The report is where a staged-and-unapproved launch is
disclosed, per `references/final-report.md` §4.

## Manual fallback

If the CLI installer cannot run, the exact step is to install or upgrade `@rosthq/cli`:

```bash
npx @rosthq/cli@latest --version
```

Do not hand-copy files from this repository, because hand-copied content is unverified and will not carry a `.rost-skill-release.json` provenance marker.
