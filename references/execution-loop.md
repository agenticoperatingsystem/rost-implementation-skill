# Execution loop

This is the canonical composite implementation loop — steps 5 through 14 of the flow in SKILL.md, plus close-out (step 16). Bootstrap, implementation access, and discovery (steps 1–4) come first, and runner setup (step 6) has its own reference: [runner-setup.md](runner-setup.md). Every command invocation is preceded by `rost command schema <id>`; never guess JSON shapes.

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

## Ingest sources (step 7)

For each allowed local business source in the supplied workspace, call `onboarding.source_ingest`:

- It accepts only bounded allowlisted source kinds. The server writes encrypted bytes bound to this tenant and implementation run and computes the SHA-256 digest server-side.
- Retain only the returned opaque upload ID and safe descriptor: ID, bounded title/kind, server-computed digest, optional bounded row reference.
- Never supply client-computed SHA values, filesystem paths, URLs, or source bodies where the contract wants a descriptor — they fail before parsing.
- Uploads carry a server-derived hard access deadline (no later than 24 hours, and never beyond the live bootstrap bearer). Re-ingest rather than racing an expiry.
- After successful application the raw bytes purge; durable surfaces keep only digests and counts, and status reads then show `payload_retained: false`. Do not depend on raw payload access after that point.

## Construct one setup plan (step 8)

Design the smallest legible operating model that fits the evidence, as one plan for the composite `onboarding.setup` command (schema via `rost command schema`): company name, source descriptors, per-family reconciliation entries, Compass, one active cycle, complete Seats (Charters and their sole permission manifests), staffing (owner occupancies and planned occupants), goals, Signals, readings, Frictions, initial Tasks, Sync Brief scope, agent configuration including Skills and schedules, and an optional managed-inference hard cap.

Validate locally before staging:

- Every source reference resolves to a descriptor returned by this run's own ingestion. A missing, forged, cross-run, or outside-workspace source reference fails.
- `company_name` exactly matches the tenant's existing company name.
- Logical keys are unique; Seat and goal graphs are acyclic; Compass objectives map one-to-one; the owner occupancy target is `{ kind: "owner" }`, never a user ID.
- Planned occupants are display names only — no email, phone, token, credential, or authority.
- Every referenced published Skill is pinned to its exact version ID and content hash; never a mutable slug alone.
- Schedules use canonical cron plus a canonical IANA timezone.
- Include the managed-inference hard cap only as an explicit, visually distinct decision when the plan's managed-cloud projection requires one; never inferred or silently defaulted.
- On a `schema_version: 2` plan, the AICOS block carries exactly the preferred lane, the runner brain, the `runner_setup_id` from step 6 (or null), and whether Cloud fallback is authorized. Submit only those; the server proves the tenant, owner, run relation and current state of the referenced setup, and refuses a foreign, expired or cancelled reference outright ([runner-setup.md](runner-setup.md)).
- Every Signal carries a truthful posture: `manual`, `imported_history`, or `not_connected`. `live_verified` is refused before the approval card exists, naming each offending Signal — the connection that would prove a Signal live has to feed a Signal that already exists, and this setup is the thing creating it. Connect the integration from the Signal's own page after the company exists.
- Imported history may be owner-accepted, and it stays `imported_history`. Acceptance is not authorship and never becomes a human-authored or live reading.
- No invite, credential, secret, OAuth, external-message, or arbitrary-command content anywhere in the plan. Unknown fields fail.
- For every imported family, record what was applied and what was skipped with a typed reason — context-only rows are skips, not silent drops.

Prefer fewer, clearer objects over completeness theater.

## Stage setup — one URL (step 9)

Stage `onboarding.setup` (CLI: `onboard setup`). The server preflights the strict schema, graphs, readiness, and budget state and returns a typed error list without creating entities; fix typed errors and restage.

When staging succeeds, give the human exactly one setup approval URL with its pending confirmation ID. One composite decision covers the whole plan. Silence is never consent, and the implementation credential can never approve its own proposal. A plan that sets or changes the managed-inference hard cap stages as a dangerous-risk confirmation — expect the stricter badge and TTL.

If you restage, the older card is superseded with durable lineage; point the human at the current card only.

## Verify the setup receipt (step 10)

After the owner approves, verify with fresh reads (the setup-status read), never from memory:

- The application is applied, with its application ID and input digest/revision.
- Per-family applied/skipped counts with typed skip reasons: for every family, `input = applied + typed skips`.
- Blockers and warnings with nonzero checked counts. A zero denominator is unknown or failure, never a pass.
- The logical-key-to-ID mapping while the purgeable run-scoped payload is retained; after purge, expect IDs, counts, and keyed digests plus `payload_retained: false`.

- The AICOS binding, if the plan carried one: the requested lane, the effective lane, the typed `fallback_reason` when they differ, the preserved `runner_setup_id`, the rehearsal state, and whether the chief of staff is active or paused. Read all of it and report all of it — a Cloud-lane effective result under a Runner preference is a normal, resumable outcome, and describing it as anything else is the failure this flow guards hardest against.
- Whether the chief of staff is paused. A paused AICOS carries a recovery item, and that item IS the setup decision demoted — never a second decision row. The company is still complete.

Agents commit as `awaiting_rehearsal` with `dry_run_missing`. Do not claim any agent is execution-ready before a rehearsal exists.

The setup itself records onboarding as finished. Do not tell the owner the company is incomplete until agents are launched; it is not.

## Rehearse (step 11)

Run the run-bound `onboarding.rehearse` (CLI: `onboard rehearse`), bound to the setup application ID, the expected setup digest/revision, and its own idempotency key. The server runs exactly one sandbox rehearsal per receipt agent and returns complete immutable terminal evidence: per-agent terminal status, runtime run IDs, tool previews, manifest holds, errors, configuration digests, and the terminal rehearsal-batch receipt.

- Rehearsal never stages activation and never returns an activation URL.
- Read the evidence to full terminal state before proceeding. A same-key retry returns the prior terminal receipt; changed setup/configuration under the same key is a typed conflict — restage rather than fight it.
- Rehearsal is sandbox-only: no go-live, no schedule arming, no external communications, no credential access.

A failed rehearsal routes back to plan correction and restaging, never forward to activation.

## Launch the drafted agents — optional, once, one URL (step 12)

This step is OPTIONAL, and skipping it is a complete outcome. It launches only the additional agents the plan left in draft; it does not create the company, and it does not mark onboarding complete — the setup already did both. Take it when the owner wants those agents live now; otherwise record the later-launch actions in the final report and stop.

Invoke `onboarding.activate` (CLI: `onboard activate`) exactly once with:

- its own idempotency key;
- the setup application ID, expected input digest, and expected receipt revision;
- the terminal rehearsal-batch receipt ID;
- `rehearsal_runs`: strict `{ agent_id, rehearsal_run_id }` entries; and
- `configuration_digests`: strict `{ agent_id, configuration_digest }` entries.

Each array covers the exact agent set from the setup receipt with unique agent IDs — a missing, duplicate, or extra identity fails. Evidence from different rehearsal batches never combines into one activation.

Give the human its one launch approval URL. On approval, one transaction rechecks freshness (runner, budget, sources, Steward chain, Skills, schedules), writes one composite human decision, takes every agent live, and arms each disclosed schedule.

On a company carrying the Beta Trusted launch default, that same card also shows each agent's own authority review — what it may do unattended, what always asks, its connections, budget, and where to revoke — and approving it mints exactly one grant per agent inside the same transaction that makes it live, under that same decision. **There is no second approval and no separate Approvals card: the launch action is the one thing the owner does.** Never tell the owner to go to `/approvals` for it, and never stage anything extra "to be safe".

## Verify the launch (step 13)

Verify with fresh reads: agents live, schedules armed, the application `activated`. If the committed response is lost, retry with the same key and digest to receive the original launch receipt — there is no further approval. Step 12 and step 13 are taken together or not at all: launching without verifying is exactly the remembered-status claim this flow forbids.

## Bounded manual acceptance (step 14)

Where the owner authorized it, run bounded manual acceptance through the discovered run-now surface. Acceptance runs are `production_manual` and must say so — a production run never describes itself as a dry run. They require `execution_ready`, not merely lifecycle admission, and an implementation agent cannot self-approve a gated run.

## Report and close (steps 15–16)

Produce the mandatory report in [final-report.md](final-report.md): evidence, costs, assumptions, warnings, and unresolved source connections. Then complete implementation access — or abandon it explicitly on a failed run — so the run-bound credential and any retained source bytes purge with the run. Never leave a live implementation credential behind.

## Governance postures are prepared, never taken (any step)

`aicos.trusted_beta.status`, `aicos.trusted_beta.enable`, and `aicos.trusted_beta.disable` are owner-only and human-only. This skill may READ the status — it is a read, and its review is what the owner needs in order to decide — and may prepare and present the decision. It may not enable or disable the posture, and it may not approve the confirmation that does. Prepare, hand over, return control.

The same rule covers every confirmation this run stages: the implementation credential cannot approve its own proposal, and no message, transcript, or inference is a substitute for the owner's own act.

## Idempotency and contradiction handling

- Check existence before create calls; resume from the last verified milestone.
- If a live read contradicts a provisional fact, surface the contradiction and ask for resolution. Do not silently merge.
- If required evidence is missing, log an explicit assumption or gap and continue with what is available.
- Never fabricate people, accountabilities, goals, targets, readings, source bindings, credentials, or evidence.

## Rejected: the multi-gate recipe

Do not implement a company by looping per-Seat creation, per-Charter activation, and per-agent go-live commands with individual confirmations. That recipe is retired and rejected — see SKILL.md, "The retired multi-gate recipe is rejected". The composite flow above is the only supported implementation path.
