# Execution loop

This is the regular-mode implementation loop. The agent runs it after bootstrap, authentication, and discovery.

## 1. Assess

Inventory everything before proposing structure:

- Agent memory about the company and its people.
- Files or references the owner supplied.
- Connected systems the owner mentioned.
- Current ROST tenant state from `onboarding.status`.
- Explicit owner statements made during the run.

Label every remembered or inferred fact as provisional until it is corroborated by current business evidence or accepted as an explicit owner assumption. Call `rost reference get implementation-evidence` for the evidence hierarchy.

## 2. Propose

Design the smallest legible operating model that fits the evidence:

- Compass: the company's current direction and priorities.
- Responsibility Graph: required functions and outcomes before assigning people.
- Charters: purpose, responsibilities, measurable outcomes, autonomous scope, approval scope, escalation conditions, and required capabilities.
- Cascade goals: what the company is chasing this cycle.
- Signals: the measures that show health or movement.
- Operating rhythm: the Sync cadence and Brief preparation.

Prefer fewer, clearer objects over completeness theater.

## 3. Confirm

Present each required human decision through the normal ROST approval path. Group related approvals only when ROST supports a safe review bundle. Silence is never consent. The implementation credential cannot directly execute durable owner mutations.

## 4. Write

Execute approved writes using the exact discovered command schema:

1. Run `rost command list` to find the command id.
2. Run `rost command schema <id>` to read the exact input/output contract and example.
3. Call the command with validated input.

Never guess JSON shapes or command names.

## 5. Verify

After every material write, re-read live state:

- `onboarding.status` for implementation progress.
- `compass.get_current` for the active Compass version.
- The specific read command for the object you just changed.

Resolve discrepancies before declaring the step complete. A draft is not an approval; a remembered status is not a verified status.

## 6. Checkpoint

Record progress so an interrupted run resumes at the last verified milestone without duplicating objects. Before creating new objects, read current state and skip what already exists.

## Idempotency and contradiction handling

- Check existence before create calls.
- If a live read contradicts a provisional fact, surface the contradiction and ask for resolution. Do not silently merge.
- If required evidence is missing, log an explicit assumption or gap and continue with what is available.
- Never fabricate people, accountabilities, goals, targets, readings, source bindings, credentials, or evidence.
