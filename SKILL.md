---
name: rost-implementation
description: Implement ROST for a company end to end. Use when the owner gives you this skill's link or asks you to set up ROST, configure their company on ROST, or run agent-led ROST onboarding. Covers bootstrap, implementation access, discovery, runner setup, source ingest, the composite one-approval setup, rehearsal, optional agent launch, verification, reporting, and handoff.
---

# ROST implementation

## What this is

This skill turns a general-purpose agent into a mode-aware ROST implementer. It runs the canonical composite onboarding flow: prepare the owner's local execution runner, ingest the owner's local business sources, stage one setup approval, verify the setup receipt, rehearse the agents the plan proposes, optionally stage one launch approval for the agents left in draft, verify, report, and close implementation access.

**A complete implementation asks the owner for exactly ONE composite decision — the setup approval.** That single approval creates the company, configures the AI Chief of Staff on its lane, and records onboarding as finished. Launching the additional agents a plan leaves in draft is a second, OPTIONAL composite decision the owner may take later; a run that stops after setup has delivered a complete operating company, not an incomplete one. Never zero approvals, and never one approval per object.

It works in regular implementation-bootstrap mode today: it drafts and stages the setup decision, then pauses for the owner's explicit approval. Full Operator external-effect handoff activates only through live capability discovery in the installed CLI; until then, treat it as unavailable. See [references/mode-behavior.md](references/mode-behavior.md).

## Provenance and integrity

This package installs only through a signed, verified release. The installer (`rost skills install-implementation`) verifies the release tag's SSH signature against a trust root compiled into the ROST CLI before it trusts the manifest or any checksum.

Signer fingerprint (public material, safe to print):

```
SHA256:ziSyU9vhGi0Q3GaeePB1R6BI3GqXutLhepnF/4Hx4rY
```

The installed copy carries a `.rost-skill-release.json` marker with source, tag, commit, and manifest checksum. Quote it when reporting which implementation method ran.

## Hard rules

These rules bind in every mode. This package's validation fixtures pin them in CI.

- **Do not invite teammates.** A setup plan contains no invite operations. Planned occupants are display labels with no authority, no membership, and no Steward-chain validity.
- **Do not send external communications.** No email, Slack, payments, or any other external side effect, in any mode available today.
- **Do not read outside the supplied workspace.** The owner-supplied business folder is the only readable business source. Never browse the wider filesystem, other repositories, or the network for business facts.
- **Do not claim Full Operator unless discovered active.** Only live capability discovery against the installed CLI can prove it; these instructions cannot.
- **Do not claim runner execution unless readiness proves a runner.** A requested runner lane with no live compatible runner is not execution-ready.
- **Do not hide a lane fallback.** The AI Chief of Staff falls back from a preferred Runner lane to the Cloud lane when the Runner lane cannot be served, and that fallback is always VISIBLE: report the requested lane, the effective lane, and the typed reason the receipt carries. Reporting a Cloud-lane agent as runner-executed is the single worst failure this flow has, and `fixtures/negative/silent-cloud-fallback.json` pins its rejection in CI.
- **Do not submit a Signal as live.** OAuth and source-system login are human acts that happen after the company exists, so a setup plan cannot prove any Signal is live. Submit Signals as manual, imported history, or not connected; a `live_verified` posture is refused before the approval card is created, per Signal, and `fixtures/negative/oauth-gated-live-signal.json` pins that rejection.
- **Resolve and pin exact published Skill version IDs and content hashes before staging; never submit mutable slugs alone.** If a new version publishes after pinning, approval fails stale and requires restaging — never a silent upgrade.
- **Do not claim useful source-backed output when source systems are absent.** Absent sources are reported as typed warnings and unresolved connections; readings, queues, and results are never fabricated from them.
- **Do not enable a governance posture on the owner's behalf.** Trusted-posture commands are owner-only and human-only. Prepare the review and hand it over; never approve it.
- Never mint, accept, or relay credentials or secrets, and never complete OAuth on the owner's behalf.

## Canonical flow

Follow these sixteen steps in order. Steps 12 and 13 are the optional pair. Phase detail lives in the linked references.

1. **Inspect local business files only** — read-only inventory of the supplied workspace; label remembered facts provisional ([references/execution-loop.md](references/execution-loop.md)).
2. **Install/verify the current CLI** — see Bootstrap below.
3. **Obtain implementation access** — see Implementation access below.
4. **Discover schemas/references/capabilities** — see Discover before acting below.
5. **Read onboarding resume state** — the setup-status read; resume, never duplicate ([references/execution-loop.md](references/execution-loop.md)).
6. **Prepare the runner setup** — drive the resumable runner lifecycle and hand the owner its human actions ([references/runner-setup.md](references/runner-setup.md)).
7. **Ingest sources** — run `onboarding.source_ingest` for each allowed local business source and retain only the returned opaque descriptors/digests ([references/execution-loop.md](references/execution-loop.md)).
8. **Construct and locally validate one setup plan** from those descriptors; a missing, forged, cross-run, or outside-workspace source reference fails ([references/execution-loop.md](references/execution-loop.md)).
9. **Stage setup and give the human one URL** — `onboarding.setup` ([references/execution-loop.md](references/execution-loop.md)).
10. **Wait and verify the setup receipt** with fresh reads ([references/execution-loop.md](references/execution-loop.md)).
11. **Rehearse** — run the run-bound `onboarding.rehearse` flow and read its complete immutable terminal evidence ([references/execution-loop.md](references/execution-loop.md)).
12. **Launch the drafted agents (OPTIONAL)** — invoke `onboarding.activate` once with the exact unique-agent-ID evidence arrays, then give the human its one launch URL ([references/execution-loop.md](references/execution-loop.md)).
13. **Wait and verify the launch** with fresh reads — taken together with step 12 or not at all ([references/execution-loop.md](references/execution-loop.md)).
14. **Run bounded manual acceptance where authorized** ([references/execution-loop.md](references/execution-loop.md)).
15. **Report evidence, costs, assumptions, warnings, unresolved source connections, and later-launch actions** ([references/final-report.md](references/final-report.md)).
16. **Complete/abandon implementation access** so the run-bound credential never outlives the run ([references/execution-loop.md](references/execution-loop.md)).

## The retired multi-gate recipe is rejected

Older guidance implemented onboarding by creating each Seat, activating each Charter, and taking each agent live one command at a time, then walking the owner through a client-side loop of individual confirmation approvals. That multi-gate recipe is retired and is not a supported implementation path. A client loop over N individual approvals is not atomic and never substitutes for the composite decisions. The individual commands remain for advanced, human-driven workflows outside implementation onboarding; this skill must not use them to implement a company. The negative fixture `fixtures/negative/multi-gate-recipe.json` pins this rejection in CI.

## Bootstrap (steps 1–2)

1. Step 1 needs no CLI: inventory the supplied workspace read-only, and read nothing outside it.
2. Verify Node >= 22: `node --version`
3. Install or verify the public ROST CLI: `npx @rosthq/cli@latest --version`. The authoritative minimum compatible CLI version is `protocol.minCli` in this package's `skill-manifest.json`; the installer and CLI enforce it. If the installed CLI is older, upgrade before proceeding.
4. Run the installer for the active client:
   - `rost skills install-implementation --client claude-code`
   - `rost skills install-implementation --client codex`
   - `rost skills install-implementation --client cursor`
5. If anything is unclear, run `rost doctor`.

If the CLI predates the `skills install-implementation` command, upgrade `@rosthq/cli` first. Never install this package by hand-copying unverified files.

## Implementation access (step 3)

Start bounded implementation access with:

```bash
npx @rosthq/cli@latest implementation access start --source-client <client>
```

The owner completes browser approval; the agent receives only the run-bound implementation credential — short-lived, separately stored, fail-closed, and unable to approve its own proposals. It stages the composite onboarding decisions and performs reads; it cannot execute durable owner mutations.

Never substitute an ordinary `rost login` user session for an implementation run, and never run unattended work under a user session. If the command is absent, upgrade `@rosthq/cli` to the latest version; if it is still absent, the implementation-bootstrap surface is not yet deployed — stop and report this prerequisite exactly.

## Discover before acting (steps 4–5)

Before changing tenant state:

- Run `rost docs` to list available surfaces.
- Run `rost command list` and `rost command schema <id>` for exact command contracts. Never guess JSON shapes or command names.
- Read `rost reference get rost-implementation-method` for implementation doctrine.
- Read `rost reference get implementation-evidence` for the evidence hierarchy and provisional-assumption rules.
- Read `rost reference get runner-guide` before driving runner setup.
- Discover regular vs Full Operator capability state ([references/mode-behavior.md](references/mode-behavior.md)).
- Read onboarding resume state through the setup-status read (`onboard setup-status` in the CLI).

Use read commands only for discovery. A command that creates an immutable audit artifact (usage-snapshot class) is a write, not a status read — never use write-like commands for discovery.

Evidence outranks agent memory. Label remembered facts provisional, surface contradictions, and never silently merge them.

## Prepare the runner (step 6)

The AI Chief of Staff runs either on the owner's own machine (the Runner lane, using their local Claude or Codex subscription) or on the managed Cloud lane. Preparing the runner first is what makes the Runner lane available to the one setup approval.

Drive it with the resumable CLI lifecycle, which runs on the implementation credential:

```bash
rost runner setup start --runtime claude --agent --json
rost runner setup status --setup-id <id> --json
rost runner setup resume --setup-id <id> --json
```

Detail, the human actions it hands back, and what to do when it does not reach ready: [references/runner-setup.md](references/runner-setup.md). The short version — the parts that are rules, not guidance:

- Never read, copy, export, print, or relay the owner's Claude or Codex credentials. Setup proves local authentication exists; it never handles the secret.
- Device pairing and provider consent are human actions. Surface the exact action and wait; never attempt them.
- `rost runner setup cancel` is an owner action and is refused to this credential. Ask the owner.
- Submit only the resulting `runner_setup_id` in the plan, with the preferred lane and brain. The server proves the tenant, the owner, the run relation, and the current state; a reference to another tenant's setup, or one that has expired or been cancelled, is refused.
- A setup that has not reached ready is not a failure of the run. Say so plainly and continue — the plan may still prefer the Runner lane, and the fallback is visible and resumable.

## Execute (steps 7–14)

Follow the phases in [references/execution-loop.md](references/execution-loop.md): resume, assess, ingest sources, construct one setup plan, stage setup (one URL), verify the receipt, rehearse, optionally launch (one URL), verify, and run bounded manual acceptance.

Choose the authorization path using [references/mode-behavior.md](references/mode-behavior.md). Regular implementation-bootstrap mode stages the composite decisions; Full Operator remains structural until discovered.

## OAuth and external providers

OAuth is always a human action, and completing OAuth or source-system login is out of scope during onboarding setup. When a connection matters later, prepare the exact handoff using [references/oauth-handoff.md](references/oauth-handoff.md): provider, scopes, rationale, consent link, workflow it unblocks, and post-consent continuation state.

## External effects

Full Operator conversation-grant handoff for external effects (email, Slack) is not yet available. Do not attempt external sends. See [references/conversation-grant-handoff.md](references/conversation-grant-handoff.md).

## Finish (steps 15–16)

- Verify every material write with a fresh read.
- Leave explicit assumptions and gaps rather than hiding incompleteness.
- Every implementation run ends with the report in [references/final-report.md](references/final-report.md): evidence, costs, assumptions, warnings, unresolved source connections, and the concrete later-launch actions the owner can take next.
- Then complete implementation access — or abandon it explicitly on a failed run — so the run-bound credential and retained source bytes purge with the run.
- Never fabricate people, goals, readings, bindings, credentials, or evidence.

When implementation finishes, the owner should see a populated Home: the Responsibility Graph, the current Compass state, the AI Chief of Staff on the lane it actually ended up on, any agents launched with their schedules armed, and the named next actions for everything deliberately left for later.
