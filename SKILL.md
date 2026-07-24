---
name: rost-implementation
description: Implement ROST for a company end to end. Use when the owner gives you this skill's link or asks you to set up ROST, configure their company on ROST, or run agent-led ROST onboarding. Covers bootstrap, authentication, business discovery, regular-mode implementation, verification, and handoff.
---

# ROST implementation

## What this is

This skill turns a general-purpose agent into a mode-aware ROST implementer. It works in regular mode today: it drafts and stages work, then pauses for the owner's explicit approval before any durable change. Full Operator external-effect handoff activates only through live capability discovery in the installed CLI; until then, treat it as unavailable. See [references/mode-behavior.md](references/mode-behavior.md) for the distinction.

## Provenance and integrity

This package installs only through a signed, verified release. The installer (`rost skills install-implementation`) verifies the release tag's SSH signature against a trust root compiled into the ROST CLI before it trusts the manifest or any checksum.

Signer fingerprint (public material, safe to print):

```
SHA256:ziSyU9vhGi0Q3GaeePB1R6BI3GqXutLhepnF/4Hx4rY
```

The installed copy carries a `.rost-skill-release.json` marker with source, tag, commit, and manifest checksum. Quote it when reporting which implementation method ran.

## Bootstrap

1. Verify Node >= 22: `node --version`
2. Install or verify the public ROST CLI:
   - `npx @rosthq/cli@latest --version`
   - Minimum version: `0.7.115` (the CLI will enforce this).
3. Run the installer for the active client:
   - `rost skills install-implementation --client claude-code`
   - `rost skills install-implementation --client codex`
   - `rost skills install-implementation --client cursor`
4. If anything is unclear, run `rost doctor`.

If the CLI predates the `skills install-implementation` command, upgrade `@rosthq/cli` first. Never install this package by hand-copying unverified files.

## Authenticate

Use live capability discovery to find the implementation-purpose device exchange:

1. Run `rost docs` to list available surfaces.
2. After the owner authenticates in the browser, run `rost command list` to find the implementation-purpose device-exchange command.

If that command is absent:

- Upgrade `@rosthq/cli` to the latest version.
- If it is still absent, the implementation-bootstrap surface is not yet deployed. Stop and report this prerequisite exactly.

Never substitute an ordinary `rost login` user session for an implementation run. The owner completes browser approval; the agent receives only the run-bound implementation credential and never a Supabase user session. Never run unattended work under a user session.

## Discover before acting

Before changing tenant state:

- Read `rost reference get rost-implementation-method` for implementation doctrine.
- Read `rost reference get implementation-evidence` for the evidence hierarchy and provisional-assumption rules.
- Run `rost command list` and `rost command schema <id>` for exact command contracts. Never guess JSON shapes.
- Call `onboarding.status` to read current tenant state.

Evidence outranks agent memory. Label remembered facts provisional, surface contradictions, and never silently merge them.

## Execute

Follow the loop in [references/execution-loop.md](references/execution-loop.md): assess, propose, confirm, write, verify, checkpoint.

Choose the authorization path using [references/mode-behavior.md](references/mode-behavior.md):

- Regular mode: draft and stage, then pause for human approval.
- Full Operator mode: structural description only; external-effect handoff is not yet available.

## OAuth and external providers

OAuth is always a human action. Prepare the exact handoff using [references/oauth-handoff.md](references/oauth-handoff.md): provider, scopes, rationale, consent link, workflow it unblocks, and post-consent continuation state.

## External effects

Full Operator conversation-grant handoff for external effects (email, Slack) is not yet available. Do not attempt external sends. See [references/conversation-grant-handoff.md](references/conversation-grant-handoff.md).

## Finish

- Verify every material write with a fresh read.
- Leave explicit assumptions and gaps rather than hiding incompleteness.
- Full Operator runs must end with the report in [references/final-report.md](references/final-report.md).
- Regular-mode runs close with the normal ROST completion summary.
- Never fabricate people, goals, readings, bindings, credentials, or evidence.

When implementation finishes, the owner should see the Responsibility Graph, the current Compass state, and the next recommended actions.
