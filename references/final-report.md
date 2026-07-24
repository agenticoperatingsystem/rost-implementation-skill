# Final implementation report

This report schema is mandatory for Full Operator runs and optional but useful for regular-mode runs.

## Report structure

1. Evidence used
   - Files, references, owner statements, and live ROST reads that shaped the implementation.
   - Note which facts were provisional or explicitly assumed.

2. Objects created or changed
   - Compass versions, Responsibility Graph objects, Seats, Charters, Cascade goals, Signals, Frictions, tasks, credentials, and bindings.

3. Assumptions
   - Explicit assumptions accepted by the owner or left unresolved.

4. Authority exercised
   - The standing authorization reference that enabled Full Operator mode.
   - The scope and duration of the grant.

5. Conversational grants used
   - Which bounded conversational grants were active and for what actions.

6. Connections configured
   - OAuth handoffs completed, with provider, scopes, and verification status.

7. Verification results
   - Live reads that confirm each material write, and any discrepancies found.

8. Unresolved gaps
   - Missing evidence, declined OAuth connections, skipped steps, or incomplete objects.

9. Full Operator revocation path
   - How the owner can review and revoke the standing authorization.

## When this report is mandatory

This report is mandatory only when Full Operator mode is available and active. In regular mode, the run closes with the normal ROST completion summary; supplying this report is optional.

## Honesty

If a section has nothing to report, say so. Do not fabricate people, accountabilities, goals, targets, readings, source bindings, credentials, or evidence to make the report look complete.
