# Final implementation report

This report is step 15 of the canonical flow and is mandatory for every implementation run — regular or Full Operator — before completing or abandoning implementation access (step 16). It covers evidence, costs, assumptions, warnings, unresolved source connections, and the concrete later-launch actions the owner can take next.

## Report structure

1. Evidence used
   - Workspace files, references, owner statements, and live ROST reads that shaped the implementation.
   - Note which facts were provisional or explicitly assumed, and which were corroborated.

2. Objects created or changed
   - Taken from receipts and fresh reads, never from memory: setup application ID with input digest/revision, and the launch receipt if a launch was taken.
   - Per-family counts from the setup receipt — sources, Seats, planned people, goals, Signals, readings, Frictions, Tasks, schedules, agents — with, for each family, `input = applied + typed skips` and every typed skip's reason.
   - Compass version, active cycle, and Sync Brief scope.

3. The AI Chief of Staff, and the lane it actually reached
   - The requested lane and the effective lane, stated separately and taken from the receipt's binding, never from the plan.
   - When they differ, the typed `fallback_reason` the receipt carries — `runner_setup_absent`, `runner_setup_incomplete`, or `runner_not_ready` — in plain words, plus the preserved `runner_setup_id` and what the owner would do to move the lane over.
   - Whether the chief of staff is active or paused, the rehearsal state it was decided from, and the recovery item if it is paused.
   - The runner setup's own final stage and blocker, if it did not reach ready.
   - Never describe a Cloud-lane chief of staff as running on the owner's runner, and never present a Runner preference as a Runner outcome.

4. Approvals
   - The setup confirmation ID with its consumed state — one composite decision, always.
   - The launch confirmation ID with its consumed state, if a launch was taken. A run with no launch reports "not taken", not "missing".
   - Any other approval raised during the run is a defect to report, not to hide.

5. Costs
   - The run's own token and cost totals as reported by the client harness running this skill.
   - Tenant managed-inference spend against the hard cap, taken from the budget read path (settings-class read commands). Never invoke an audit-capture write command (usage-snapshot class) just to report; use reads.
   - The approved hard cap decision, if the plan carried one.

6. Assumptions
   - Explicit assumptions accepted by the owner or left unresolved.

7. Warnings and blockers
   - Every warning or blocker surfaced by preflight, readiness, rehearsal, or activation, with its checked counts. A zero denominator is reported as unknown, never as a pass.

8. Unresolved source connections
   - Every absent, declined, or pending source system: what it blocks, the manual fallback, and the OAuth handoff state. Where useful operation is partial because a source is absent, say so plainly.

9. Verification results
   - The fresh reads that confirm each material write, and any discrepancies found.

10. Full Operator sections (only when discovered active)
   - Authority exercised: the standing authorization reference, its scope and duration.
   - Conversational grants used: which bounded grants were active and for what actions.
   - The revocation path: how the owner reviews and revokes the standing authorization.
   - In a regular-mode run, state that regular implementation-bootstrap mode was used and these sections do not apply.

11. Later launch actions
    - The named next actions for everything this run deliberately left for later. Concrete and derived from the receipt, never a generic checklist — each one names the object and the exact command or page.
    - **Launch the drafted agents.** List each agent the plan left in draft with its Seat, and say that launching it is one action from that Seat (`onboarding.activate` for the setup's own draft set, or the Seat's own launch for later ones). On a Beta company the launch card carries the agent's authority review and mints its grant in the same transaction — one action, no Approvals detour, no second approval.
    - **Choose the Trusted posture.** If the company is on the Beta plan, say that `aicos.trusted_beta.status` shows the current review and `aicos.trusted_beta.enable` opts in, that both are owner-only and human-only, and that `aicos.trusted_beta.disable` turns it back off for future launches without revoking anything already granted (that is `agent.trust.revoke`, per agent). State the posture as it stands now.
    - **Connect the Signals.** For each Signal submitted as `manual`, `imported_history`, or `not_connected`, name it and say that its source is connected from that Signal's own page now that the Signal exists.
    - **Finish the runner.** If the AI Chief of Staff fell back to Cloud, name the stage the runner setup stopped at, the human action it waits on, and that the preserved preference is what lets the lane move over afterwards.
    - If a category has nothing in it, say so. An empty later-actions section on a run that left agents in draft is a defect.

12. Implementation access disposition
    - Whether implementation access was completed or abandoned, and when.

## Honesty

If a section has nothing to report, say so. Do not fabricate people, accountabilities, goals, targets, readings, source bindings, credentials, or evidence to make the report look complete. A draft is not an approval; a remembered status is not a verified status. A preferred lane is not an effective lane, and a run that stopped before launching the drafted agents delivered a complete operating company — say that plainly rather than framing it as unfinished.
