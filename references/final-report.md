# Final implementation report

This report is step 14 of the canonical flow and is mandatory for every implementation run — regular or Full Operator — before completing or abandoning implementation access (step 15). It covers evidence, costs, assumptions, warnings, and unresolved source connections.

## Report structure

1. Evidence used
   - Workspace files, references, owner statements, and live ROST reads that shaped the implementation.
   - Note which facts were provisional or explicitly assumed, and which were corroborated.

2. Objects created or changed
   - Taken from receipts and fresh reads, never from memory: setup application ID with input digest/revision, and the activation receipt.
   - Per-family counts from the setup receipt — sources, Seats, planned people, goals, Signals, readings, Frictions, Tasks, schedules, agents — with, for each family, `input = applied + typed skips` and every typed skip's reason.
   - Compass version, active cycle, and Sync Brief scope.

3. Approvals
   - Exactly two composite decisions: the setup confirmation ID and the activation confirmation ID, each with its consumed state. Any other approval raised during the run is a defect to report, not to hide.

4. Costs
   - The run's own token and cost totals as reported by the client harness running this skill.
   - Tenant managed-inference spend against the hard cap, taken from the budget read path (settings-class read commands). Never invoke an audit-capture write command (usage-snapshot class) just to report; use reads.
   - The approved hard cap decision, if the plan carried one.

5. Assumptions
   - Explicit assumptions accepted by the owner or left unresolved.

6. Warnings and blockers
   - Every warning or blocker surfaced by preflight, readiness, rehearsal, or activation, with its checked counts. A zero denominator is reported as unknown, never as a pass.

7. Unresolved source connections
   - Every absent, declined, or pending source system: what it blocks, the manual fallback, and the OAuth handoff state. Where useful operation is partial because a source is absent, say so plainly.

8. Verification results
   - The fresh reads that confirm each material write, and any discrepancies found.

9. Full Operator sections (only when discovered active)
   - Authority exercised: the standing authorization reference, its scope and duration.
   - Conversational grants used: which bounded grants were active and for what actions.
   - The revocation path: how the owner reviews and revokes the standing authorization.
   - In a regular-mode run, state that regular implementation-bootstrap mode was used and these sections do not apply.

10. Implementation access disposition
    - Whether implementation access was completed or abandoned, and when.

## Honesty

If a section has nothing to report, say so. Do not fabricate people, accountabilities, goals, targets, readings, source bindings, credentials, or evidence to make the report look complete. A draft is not an approval; a remembered status is not a verified status.
