# Execution loop

This is the canonical composite implementation loop — steps 5 through 13 of the flow in SKILL.md, plus close-out (step 15). Bootstrap, implementation access, and discovery (steps 1–4) come first. Every command invocation is preceded by `rost command schema <id>`; never guess JSON shapes.

## Resume before creating anything (step 5)

- Read onboarding resume state through the setup-status read (`onboard setup-status` in the CLI; confirm the exact command id with `rost command list`).
- An interrupted run resumes at the last verified milestone. Before creating anything, read current state and skip what already exists.
- Reuse idempotency keys deliberately: the same key with the same content returns the prior result; the same key with different content is a typed conflict, not a retry.

## Assess (workspace-only)

Inventory everything before proposing structure:

- Files in the supplied workspace — the only readable business source. Never read above or outside it.
- Explicit owner statements made during the run.
- Source systems the owner mentioned (as facts about connections, not as things to log into).
- Current ROST tenant state from read commands.

Label every remembered or inferred fact as provisional until it is corroborated by current business evidence or accepted as an explicit owner assumption. Call `rost reference get implementation-evidence` for the evidence hierarchy.

## Ingest sources (step 6)

For each allowed local business source in the supplied workspace, call `onboarding.source_ingest`:

- It accepts only bounded allowlisted source kinds. The server writes encrypted bytes bound to this tenant and implementation run and computes the SHA-256 digest server-side.
- Retain only the returned opaque upload ID and safe descriptor: ID, bounded title/kind, server-computed digest, optional bounded row reference.
- Never supply client-computed SHA values, filesystem paths, URLs, or source bodies where the contract wants a descriptor — they fail before parsing.
- Uploads carry a server-derived hard access deadline (no later than 24 hours, and never beyond the live bootstrap bearer). Re-ingest rather than racing an expiry.
- After successful application the raw bytes purge; durable surfaces keep only digests and counts, and status reads then show `payload_retained: false`. Do not depend on raw payload access after that point.

## Construct one setup plan (step 7)

Design the smallest legible operating model that fits the evidence, as one plan for the composite `onboarding.setup` command (schema via `rost command schema`): company name, source descriptors, per-family reconciliation entries, Compass, one active cycle, complete Seats (Charters and their sole permission manifests), staffing (owner occupancies and planned occupants), goals, Signals, readings, Frictions, initial Tasks, Sync Brief scope, agent configuration including Skills and schedules, and an optional managed-inference hard cap.

Validate locally before staging:

- Every source reference resolves to a descriptor returned by this run's own ingestion. A missing, forged, cross-run, or outside-workspace source reference fails.
- `company_name` exactly matches the tenant's existing company name.
- Logical keys are unique; Seat and goal graphs are acyclic; Compass objectives map one-to-one; the owner occupancy target is `{ kind: "owner" }`, never a user ID.
- Planned occupants are display names only — no email, phone, token, credential, or authority.
- Every referenced published Skill is pinned to its exact version ID and content hash; never a mutable slug alone.
- Schedules use canonical cron plus a canonical IANA timezone.
- Include the managed-inference hard cap only as an explicit, visually distinct decision when the plan's managed-cloud projection requires one; never inferred or silently defaulted.
- No invite, credential, secret, OAuth, external-message, or arbitrary-command content anywhere in the plan. Unknown fields fail.
- For every imported family, record what was applied and what was skipped with a typed reason — context-only rows are skips, not silent drops.

Prefer fewer, clearer objects over completeness theater.

## Stage setup — one URL (step 8)

Stage `onboarding.setup` (CLI: `onboard setup`). The server preflights the strict schema, graphs, readiness, and budget state and returns a typed error list without creating entities; fix typed errors and restage.

When staging succeeds, give the human exactly one setup approval URL with its pending confirmation ID. One composite decision covers the whole plan. Silence is never consent, and the implementation credential can never approve its own proposal. A plan that sets or changes the managed-inference hard cap stages as a dangerous-risk confirmation — expect the stricter badge and TTL.

If you restage, the older card is superseded with durable lineage; point the human at the current card only.

## Verify the setup receipt (step 9)

After the owner approves, verify with fresh reads (the setup-status read), never from memory:

- The application is applied, with its application ID and input digest/revision.
- Per-family applied/skipped counts with typed skip reasons: for every family, `input = applied + typed skips`.
- Blockers and warnings with nonzero checked counts. A zero denominator is unknown or failure, never a pass.
- The logical-key-to-ID mapping while the purgeable run-scoped payload is retained; after purge, expect IDs, counts, and keyed digests plus `payload_retained: false`.

Agents commit as `awaiting_rehearsal` with `dry_run_missing`. Do not claim any agent is execution-ready before a rehearsal exists.

## Rehearse (step 10)

Run the run-bound `onboarding.rehearse` (CLI: `onboard rehearse`), bound to the setup application ID, the expected setup digest/revision, and its own idempotency key. The server runs exactly one sandbox rehearsal per receipt agent and returns complete immutable terminal evidence: per-agent terminal status, runtime run IDs, tool previews, manifest holds, errors, configuration digests, and the terminal rehearsal-batch receipt.

- Rehearsal never stages activation and never returns an activation URL.
- Read the evidence to full terminal state before proceeding. A same-key retry returns the prior terminal receipt; changed setup/configuration under the same key is a typed conflict — restage rather than fight it.
- Rehearsal is sandbox-only: no go-live, no schedule arming, no external communications, no credential access.

A failed rehearsal routes back to plan correction and restaging, never forward to activation.

## Activate — once, one URL (step 11)

Invoke `onboarding.activate` (CLI: `onboard activate`) exactly once with:

- its own idempotency key;
- the setup application ID, expected input digest, and expected receipt revision;
- the terminal rehearsal-batch receipt ID;
- `rehearsal_runs`: strict `{ agent_id, rehearsal_run_id }` entries; and
- `configuration_digests`: strict `{ agent_id, configuration_digest }` entries.

Each array covers the exact agent set from the setup receipt with unique agent IDs — a missing, duplicate, or extra identity fails. Evidence from different rehearsal batches never combines into one activation.

Give the human its one activation approval URL. On approval, one transaction rechecks freshness (runner, budget, sources, Steward chain, Skills, schedules), writes one composite human decision, takes every agent live, arms each disclosed schedule, and marks onboarding complete.

## Verify activation (step 12)

Verify with fresh reads: agents live, schedules armed, the application `activated`, onboarding complete. If the committed response is lost, retry with the same key and digest to receive the original activation receipt — there is no third approval.

## Bounded manual acceptance (step 13)

Where the owner authorized it, run bounded manual acceptance through the discovered run-now surface. Acceptance runs are `production_manual` and must say so — a production run never describes itself as a dry run. They require `execution_ready`, not merely lifecycle admission, and an implementation agent cannot self-approve a gated run.

## Report and close (steps 14–15)

Produce the mandatory report in [final-report.md](final-report.md): evidence, costs, assumptions, warnings, and unresolved source connections. Then complete implementation access — or abandon it explicitly on a failed run — so the run-bound credential and any retained source bytes purge with the run. Never leave a live implementation credential behind.

## Idempotency and contradiction handling

- Check existence before create calls; resume from the last verified milestone.
- If a live read contradicts a provisional fact, surface the contradiction and ask for resolution. Do not silently merge.
- If required evidence is missing, log an explicit assumption or gap and continue with what is available.
- Never fabricate people, accountabilities, goals, targets, readings, source bindings, credentials, or evidence.

## Rejected: the multi-gate recipe

Do not implement a company by looping per-Seat creation, per-Charter activation, and per-agent go-live commands with individual confirmations. That recipe is retired and rejected — see SKILL.md, "The retired multi-gate recipe is rejected". The composite flow above is the only supported implementation path.
